import http from "http"
import path from "path"
import express from "express"
import { Server, Socket } from "socket.io"
import { MongoClient, ObjectId } from "mongodb"
import type mongodb from "mongodb"
import axios from "axios"
import { AppUser, CurrentEditorsEvent, Policy, Comment, CommentThread, MousePointerEvent } from "./models"

const APP_ROOM_PREFIX : string = "app:"
const PAGE_ROOM_PREFIX : string = "page:"
const ROOT_NAMESPACE : string = "/"
const PAGE_EDIT_NAMESPACE : string = "/page/edit"

const EDITORS_EVENT_NAME : string = "collab:online_editors"
const START_EDIT_EVENT_NAME : string = "collab:start_edit"
const LEAVE_EDIT_EVENT_NAME : string = "collab:leave_edit"
const MOUSE_POINTER_EVENT_NAME : string = "collab:mouse_pointer"


const MONGODB_URI = process.env.APPSMITH_MONGODB_URI
if (MONGODB_URI == null || MONGODB_URI === "" || !MONGODB_URI.startsWith("mongodb")) {
	console.error("Please provide a valid value for `APPSMITH_MONGODB_URI`.")
	process.exit(1)
}

const API_BASE_URL = process.env.APPSMITH_API_BASE_URL
if (API_BASE_URL == null || API_BASE_URL === "") {
	console.error("Please provide a valid value for `APPSMITH_API_BASE_URL`.")
	process.exit(1)
}

main()

function main() {
	const app = express()
	const server = new http.Server(app)
	const io = new Server(server, {
		// TODO: Remove this CORS configuration.
		cors: {
			origin: "*",
		},
	})

	const port = 8091

	app.get("/", (req, res) => {
		res.redirect("/index.html")
	})

	io.on("connection", (socket: Socket) => {
		subscribeToEditEvents(socket, APP_ROOM_PREFIX)
		onAppSocketConnected(socket)
			.catch((error) => console.error("Error in socket connected handler", error))
	})

	io.of(PAGE_EDIT_NAMESPACE).on("connection", (socket: Socket) => {
		subscribeToEditEvents(socket, PAGE_ROOM_PREFIX);
		onPageSocketConnected(socket, io)
			.catch((error) => console.error("Error in socket connected handler", error))
	});

	io.of(ROOT_NAMESPACE).adapter.on("leave-room", (room, id) => {
		sendCurrentUsers(io, room, APP_ROOM_PREFIX);
	});
	
	io.of(ROOT_NAMESPACE).adapter.on("join-room", (room, id) => {
		sendCurrentUsers(io, room, APP_ROOM_PREFIX);
	});

	io.of(PAGE_EDIT_NAMESPACE).adapter.on("leave-room", (room, id) => {
		if(room.startsWith(PAGE_ROOM_PREFIX)) { // someone left the page edit, notify others
			io.of(PAGE_EDIT_NAMESPACE).to(room).emit(LEAVE_EDIT_EVENT_NAME, id);
		}
	});

	watchMongoDB(io)
		.catch((error) => console.error("Error watching MongoDB", error))

	app.use(express.static(path.join(__dirname, "static")))
	server.listen(port, () => {
		console.log(`RTS running at http://localhost:${port}`)
	})
}

function joinEditRoom(socket:Socket, roomId:string, roomPrefix:string) {
	// remove this socket from any other app rooms
	socket.rooms.forEach(roomName => {
		if(roomName.startsWith(roomPrefix)) {
			socket.leave(roomName);
		}
	});

	// add this socket to room with application id
	let roomName = roomPrefix + roomId;
	socket.join(roomName);
}

function subscribeToEditEvents(socket:Socket, appRoomPrefix:string) {
	socket.on(START_EDIT_EVENT_NAME, (resourceId) => {
		if(socket.data.email) {  // user is authenticated, join the room now
			joinEditRoom(socket, resourceId, appRoomPrefix)
		} else { // user not authenticated yet, save the resource id and room prefix to join later after auth
			socket.data.pendingRoomId = resourceId
			socket.data.pendingRoomPrefix = appRoomPrefix
		}
	});

	socket.on(LEAVE_EDIT_EVENT_NAME, (resourceId) => {
		let roomName = appRoomPrefix + resourceId;
		socket.leave(roomName);  // remove this socket from room
	});
}

async function onAppSocketConnected(socket:Socket) {
	let isAuthenticated = await tryAuth(socket)
	if(isAuthenticated) {
		socket.join("email:" + socket.data.email)
	}
}

async function onPageSocketConnected(socket:Socket, socketIo:Server) {
	let isAuthenticated = await tryAuth(socket)
	if(isAuthenticated) {
		socket.on(MOUSE_POINTER_EVENT_NAME, (event:MousePointerEvent) => {
			event.user = new AppUser(socket.data.name, socket.data.email)
			event.socketId = socket.id
			socketIo.of(PAGE_EDIT_NAMESPACE).to(PAGE_ROOM_PREFIX+event.pageId).emit(MOUSE_POINTER_EVENT_NAME, event);
		});
	}
}

async function tryAuth(socket:Socket) {
	const connectionCookie = socket.handshake.headers.cookie
	if (connectionCookie != null && connectionCookie !== "") {
		const sessionCookie = connectionCookie.match(/\bSESSION=\S+/)[0]
		let response
		try {
			response = await axios.request({
				method: "GET",
				url: API_BASE_URL + "/applications/new",
				headers: {
					Cookie: sessionCookie,
				},
			})
		} catch (error) {
			if (error.response?.status === 401) {
				console.info("Couldn't authenticate user with cookie:")
			} else {
				console.error("Error authenticating", error)
			}
			return false
		}
	
		const email = response.data.data.user.email
		const name = response.data.data.user.name ? response.data.data.user.name : email;
	
		socket.data.email = email
		socket.data.name = name
		
		if(socket.data.pendingRoomId) {  // an appId or pageId is pending for this socket, join now
			joinEditRoom(socket, socket.data.pendingRoomId, socket.data.pendingRoomPrefix);
		}

		return true
	}
	return false
	
}

async function watchMongoDB(io) {
	const client = await MongoClient.connect(MONGODB_URI, { useUnifiedTopology: true });
	const db = client.db()

	const threadCollection: mongodb.Collection<CommentThread> = db.collection("commentThread")

	const commentChangeStream = db.collection("comment").watch(
		[
			// Prevent server-internal fields from being sent to the client.
			{
				$unset: [
					"deletedAt",
					"_class",
				].map(f => "fullDocument." + f)
			},
		],
		{ fullDocument: "updateLookup" }
	);

	commentChangeStream.on("change", async (event: mongodb.ChangeEventCR<Comment>) => {
		let eventName = event.operationType + ":" + event.ns.coll

		const comment: Comment = event.fullDocument
		if(comment.deleted) {
			eventName = 'delete' + ":" + event.ns.coll  // emit delete event if deleted=true
		}
		
		const { applicationId }: CommentThread = await threadCollection.findOne(
			{ _id: new ObjectId(comment.threadId) },
			{ projection: { applicationId: 1 } },
		)

		comment.creationTime = comment.createdAt
		comment.updationTime = comment.updatedAt
		
		delete comment.createdAt
		delete comment.updatedAt
		delete comment.deleted

		let target = io
		let shouldEmit = false

		for (const email of findPolicyEmails(comment.policies, "read:comments")) {
			shouldEmit = true
			target = target.to("email:" + email)
		}

		if (shouldEmit) {
			target.emit(eventName, { comment })
		}
	})

	const threadChangeStream = threadCollection.watch(
		[
			// Prevent server-internal fields from being sent to the client.
			{
				$unset: [
					"deletedAt",
					"_class",
				].map(f => "fullDocument." + f)
			},
		],
		{ fullDocument: "updateLookup" }
	);

	threadChangeStream.on("change", async (event: mongodb.ChangeEventCR) => {
		let eventName = event.operationType + ":" + event.ns.coll
		
		const thread = event.fullDocument
		if(thread.deleted) {
			eventName = 'delete' + ":" + event.ns.coll  // emit delete event if deleted=true
		}
		
		if (thread == null) {
			// This happens when `event.operationType === "drop"`, when a comment is deleted.
			console.error("Null document recieved for comment change event", event)
			return
		}

		thread.creationTime = thread.createdAt
		thread.updationTime = thread.updatedAt
		
		delete thread.createdAt
		delete thread.updatedAt
		delete thread.deleted

		thread.isViewed = false

		let target = io
		let shouldEmit = false

		for (const email of findPolicyEmails(thread.policies, "read:commentThreads")) {
			shouldEmit = true
			target = target.to("email:" + email)
		}

		if (shouldEmit) {
			target.emit(eventName, { thread })
		}
	})

	const notificationsStream = db.collection("notification").watch(
		[
			// Prevent server-internal fields from being sent to the client.
			{
				$unset: [
					"deletedAt",
					"deleted",
				].map(f => "fullDocument." + f)
			},
		],
		{ fullDocument: "updateLookup" }
	);

	notificationsStream.on("change", async (event: mongodb.ChangeEventCR) => {
		const notification = event.fullDocument

		if (notification == null) {
			// This happens when `event.operationType === "drop"`, when a notification is deleted.
			console.error("Null document recieved for notification change event", event)
			return
		}

		// set the type from _class attribute
		notification.type = notification._class.substr(notification._class.lastIndexOf(".") + 1)
		delete notification._class
		
		const eventName = event.operationType + ":" + event.ns.coll
		io.to("email:" + notification.forUsername).emit(eventName, { notification })
	})

	process.on("exit", () => {
		(commentChangeStream != null ? commentChangeStream.close() : Promise.bind(client).resolve())
			.then(client.close.bind(client))
			.finally("Fin")
	})

	console.log("Watching MongoDB")
}

function findPolicyEmails(policies: Policy[], permission: string): string[] {
	const emails: string[] = []
	for (const policy of policies) {
		if (policy.permission === permission) {
			for (const email of policy.users) {
				emails.push(email)
			}
			break
		}
	}
	return emails
}

function sendCurrentUsers(socketIo, roomName:string, roomPrefix:string) {
	if(roomName.startsWith(roomPrefix)) {
		socketIo.in(roomName).fetchSockets().then(sockets => {
			let onlineUsernames = new Set<string>();
			let onlineUsers = new Array<AppUser>();
			if(sockets) {
				sockets.forEach(s => {
					if(!onlineUsernames.has(s.data.email)) {
						onlineUsers.push(new AppUser(s.data.name, s.data.email));
					}
					onlineUsernames.add(s.data.email);
				});
			}
			let resourceId = roomName.replace(roomPrefix, "") // get resourceId from room name by removing the prefix
			let response = new CurrentEditorsEvent(resourceId, onlineUsers);
			socketIo.to(roomName).emit(EDITORS_EVENT_NAME, response);
		});
	}
}