import React, { RefObject, useRef, useState } from "react";
import { InjectedFormProps } from "redux-form";
import { Icon, Tag } from "@blueprintjs/core";
import { isString } from "lodash";
import {
  components,
  MenuListComponentProps,
  OptionProps,
  OptionTypeBase,
  SingleValueProps,
} from "react-select";
import { Datasource } from "entities/Datasource";
import { Colors } from "constants/Colors";
import JSONViewer from "./JSONViewer";
import FormControl from "../FormControl";
import Table from "./Table";
import { Action, QueryAction, SaaSAction } from "entities/Action";
import { useDispatch, useSelector } from "react-redux";
import ActionNameEditor from "components/editorComponents/ActionNameEditor";
import DropdownField from "components/editorComponents/form/fields/DropdownField";
import { ControlProps } from "components/formControls/BaseControl";
import ActionSettings from "pages/Editor/ActionSettings";
import { OnboardingStep } from "constants/OnboardingConstants";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import log from "loglevel";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/common";
import Text, { TextType } from "components/ads/Text";
import styled from "constants/DefaultTheme";
import { TabComponent } from "components/ads/Tabs";
import AdsIcon from "components/ads/Icon";
import { Classes } from "components/ads/common";
import FormRow from "components/editorComponents/FormRow";
import EditorButton from "components/editorComponents/Button";
import OnboardingIndicator from "components/editorComponents/Onboarding/Indicator";
import DebuggerLogs from "components/editorComponents/Debugger/DebuggerLogs";
import ErrorLogs from "components/editorComponents/Debugger/Errors";
import Resizable, {
  ResizerCSS,
} from "components/editorComponents/Debugger/Resizer";
import DebuggerMessage from "components/editorComponents/Debugger/DebuggerMessage";
import AnalyticsUtil from "utils/AnalyticsUtil";
import CloseEditor from "components/editorComponents/CloseEditor";
import { setGlobalSearchQuery } from "actions/globalSearchActions";
import { toggleShowGlobalSearchModal } from "actions/globalSearchActions";
import { omnibarDocumentationHelper } from "constants/OmnibarDocumentationConstants";
import EntityDeps from "components/editorComponents/Debugger/EntityDependecies";
import { isHidden } from "components/formControls/utils";
import {
  createMessage,
  DEBUGGER_ERRORS,
  DEBUGGER_LOGS,
  INSPECT_ENTITY,
} from "constants/messages";
import { useParams } from "react-router";
import { AppState } from "reducers";
import { ExplorerURLParams } from "../Explorer/helpers";
import MoreActionsMenu from "../Explorer/Actions/MoreActionsMenu";
import Button, { Size } from "components/ads/Button";
import { thinScrollbar } from "constants/DefaultTheme";
import ActionRightPane from "components/editorComponents/ActionRightPane";
import { SuggestedWidget } from "api/ActionAPI";
import { getActionTabsInitialIndex } from "selectors/editorSelectors";

const QueryFormContainer = styled.form`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 20px 0px 0px 0px;
  width: 100%;
  height: calc(
    100vh - ${(props) => props.theme.smallHeaderHeight} -
      ${(props) => props.theme.backBanner}
  );
  .statementTextArea {
    font-size: 14px;
    line-height: 20px;
    color: #2e3d49;
    margin-top: 5px;
  }
  .queryInput {
    max-width: 30%;
    padding-right: 10px;
  }
  .executeOnLoad {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }
`;

const ErrorMessage = styled.p`
  font-size: 14px;
  color: ${Colors.RED};
  display: inline-block;
  margin-right: 10px;
`;

const TabbedViewContainer = styled.div`
  ${ResizerCSS}
  height: ${(props) => props.theme.actionsBottomTabInitialHeight};
  // Minimum height of bottom tabs as it can be resized
  min-height: 36px;
  width: 100%;
  .react-tabs__tab-panel {
    overflow: hidden;
  }
  .react-tabs__tab-list {
    margin: 0px;
  }
  &&& {
    ul.react-tabs__tab-list {
      padding: 0px ${(props) => props.theme.spaces[12]}px;
      background-color: ${(props) =>
        props.theme.colors.apiPane.responseBody.bg};
    }
    .react-tabs__tab-panel {
      height: calc(100% - 36px);
    }
  }
  background-color: ${(props) => props.theme.colors.apiPane.responseBody.bg};
  border-top: 2px solid #e8e8e8;
`;

const SettingsWrapper = styled.div`
  padding: 16px 30px;
  overflow-y: auto;
  height: 100%;
  ${thinScrollbar};
`;

const ResultsCount = styled.div`
  position: absolute;
  right: 13px;
  top: 8px;
  color: #716e6e;
`;

const FieldWrapper = styled.div`
  margin-top: 15px;
`;

const DocumentationLink = styled.a`
  position: absolute;
  right: 23px;
  top: -6px;
`;

const SecondaryWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

const HelpSection = styled.div``;

const ResponseContentWrapper = styled.div`
  padding: 10px 15px;
  overflow-y: auto;
  height: 100%;

  ${HelpSection} {
    margin-bottom: 10px;
  }
`;

const NoResponseContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: 150px;
      height: 150px;
    }
  }
  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
`;

const ErrorContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  padding-top: 10px;
  flex-direction: column;
  & > .${Classes.ICON} {
    margin-right: 0px;
    svg {
      width: 75px;
      height: 75px;
    }
  }
  .${Classes.TEXT} {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }
`;

const ErrorDescriptionText = styled(Text)`
  width: 500px;
  text-align: center;
  line-height: 25px;
  letter-spacing: -0.195px;
`;

const StyledFormRow = styled(FormRow)`
  padding: 0px 20px;
  flex: 0;
`;

const NameWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  input {
    margin: 0;
    box-sizing: border-box;
  }
`;

const ActionsWrapper = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 50%;
  justify-content: flex-end;

  & > div {
    margin: 0 0 0 ${(props) => props.theme.spaces[7]}px;
  }

  button:last-child {
    margin-left: ${(props) => props.theme.spaces[7]}px;
  }
`;

const DropdownSelect = styled.div`
  font-size: 14px;
  margin-right: 10px;
`;

const CreateDatasource = styled.div`
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  border-top: 1px solid ${Colors.ATHENS_GRAY};
  :hover {
    cursor: pointer;
  }
  .createIcon {
    margin-right: 6px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  .plugin-image {
    height: 20px;
    width: auto;
  }
  .selected-value {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: no-wrap;
    margin-left: 6px;
  }
`;

// const ActionButton = styled(BaseButton)`
//   &&&& {
//     min-width: 72px;
//     width: auto;
//     margin: 0 5px;
//     min-height: 30px;
//   }
// `;

const NoDataSourceContainer = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-top: 62px;
  flex: 1;
  .font18 {
    width: 50%;
    text-align: center;
    margin-bottom: 23px;
    font-size: 18px;
    color: #2e3d49;
  }
`;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const TabContainerView = styled.div`
  flex: 1;
  overflow: auto;
  border-top: 2px solid ${(props) => props.theme.colors.apiPane.dividerBg};
  ${thinScrollbar}
  a {
    font-size: 14px;
    line-height: 20px;
    margin-top: 15px;
  }
  .react-tabs__tab-panel {
    overflow: scroll;
  }
  .react-tabs__tab-list {
    margin: 0px;
  }
  &&& {
    ul.react-tabs__tab-list {
      padding-left: 23px;
    }
  }
  position: relative;
`;

const InlineButton = styled(Button)`
  display: inline-flex;
  margin: 0 4px;
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  height: calc(100% - 50px);
  width: 100%;
`;

const SidebarWrapper = styled.div<{ show: boolean }>`
  border: 1px solid #e8e8e8;
  display: ${(props) => (props.show ? "flex" : "none")};
  width: ${(props) => props.theme.actionSidePane.width}px;
`;

type QueryFormProps = {
  onDeleteClick: () => void;
  onRunClick: () => void;
  onCreateDatasourceClick: () => void;
  isDeleting: boolean;
  isRunning: boolean;
  dataSources: Datasource[];
  DATASOURCES_OPTIONS: any;
  executedQueryData?: {
    body: any;
    isExecutionSuccess?: boolean;
    messages?: Array<string>;
    suggestedWidgets?: SuggestedWidget[];
  };
  runErrorMessage: string | undefined;
  location: {
    state: any;
  };
  editorConfig?: any;
  formName: string;
  settingConfig: any;
  formData: SaaSAction | QueryAction;
};

type ReduxProps = {
  actionName: string;
  responseType: string | undefined;
  pluginId: string;
  documentationLink: string | undefined;
};

export type EditorJSONtoFormProps = QueryFormProps & ReduxProps;

type Props = EditorJSONtoFormProps &
  InjectedFormProps<Action, EditorJSONtoFormProps>;

export function EditorJSONtoForm(props: Props) {
  const {
    actionName,
    dataSources,
    DATASOURCES_OPTIONS,
    documentationLink,
    editorConfig,
    executedQueryData,
    formName,
    handleSubmit,
    isRunning,
    onCreateDatasourceClick,
    onRunClick,
    responseType,
    runErrorMessage,
    settingConfig,
  } = props;
  let error = runErrorMessage;
  let output: Record<string, any>[] | null = null;
  let hintMessages: Array<string> = [];
  const panelRef: RefObject<HTMLDivElement> = useRef(null);
  const initialIndex = useSelector(getActionTabsInitialIndex);
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [tableBodyHeight, setTableBodyHeightHeight] = useState(
    window.innerHeight,
  );

  const params = useParams<{ apiId?: string; queryId?: string }>();

  const actions: Action[] = useSelector((state: AppState) =>
    state.entities.actions.map((action) => action.config),
  );
  const currentActionConfig: Action | undefined = actions.find(
    (action) => action.id === params.apiId || action.id === params.queryId,
  );
  const { pageId } = useParams<ExplorerURLParams>();

  if (executedQueryData) {
    if (!executedQueryData.isExecutionSuccess) {
      error = String(executedQueryData.body);
    } else if (isString(executedQueryData.body)) {
      output = JSON.parse(executedQueryData.body);
    } else {
      output = executedQueryData.body;
    }
    if (executedQueryData.messages && executedQueryData.messages.length) {
      hintMessages = executedQueryData.messages;
    }
  }

  const isTableResponse = responseType === "TABLE";

  const dispatch = useDispatch();

  function MenuList(props: MenuListComponentProps<{ children: Node }>) {
    return (
      <>
        <components.MenuList {...props}>{props.children}</components.MenuList>
        <CreateDatasource onClick={() => onCreateDatasourceClick()}>
          <Icon className="createIcon" icon="plus" iconSize={11} />
          Create new datasource
        </CreateDatasource>
      </>
    );
  }

  function SingleValue(props: SingleValueProps<OptionTypeBase>) {
    return (
      <components.SingleValue {...props}>
        <Container>
          <img
            alt="Datasource"
            className="plugin-image"
            src={props.data.image}
          />
          <div className="selected-value">{props.children}</div>
        </Container>
      </components.SingleValue>
    );
  }

  function CustomOption(props: OptionProps<OptionTypeBase>) {
    return (
      <components.Option {...props}>
        <Container className="t--datasource-option">
          <img
            alt="Datasource"
            className="plugin-image"
            src={props.data.image}
          />
          <div style={{ marginLeft: "6px" }}>{props.children}</div>
        </Container>
      </components.Option>
    );
  }

  const handleDocumentationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (props?.documentationLink) {
      const query = omnibarDocumentationHelper(props.documentationLink);
      if (query !== "") {
        dispatch(setGlobalSearchQuery(query));
      } else {
        dispatch(setGlobalSearchQuery("Connect to Databases"));
      }
      dispatch(toggleShowGlobalSearchModal());
      AnalyticsUtil.logEvent("OPEN_OMNIBAR", {
        source: "DATASOURCE_DOCUMENTATION_CLICK",
      });
    }
  };

  const renderEachConfig = (formName: string) => (section: any): any => {
    return section.children.map(
      (formControlOrSection: ControlProps, idx: number) => {
        if (isHidden(props.formData, section.hidden)) return null;
        if (formControlOrSection.hasOwnProperty("children")) {
          return renderEachConfig(formName)(formControlOrSection);
        } else {
          try {
            const { configProperty } = formControlOrSection;
            return (
              <FieldWrapper key={`${configProperty}_${idx}`}>
                <FormControl
                  config={formControlOrSection}
                  formName={formName}
                />
              </FieldWrapper>
            );
          } catch (e) {
            log.error(e);
          }
        }
        return null;
      },
    );
  };

  const responeTabOnRunClick = () => {
    props.onRunClick();

    AnalyticsUtil.logEvent("RESPONSE_TAB_RUN_ACTION_CLICK", {
      source: "QUERY_PANE",
    });
  };

  const responseTabs = [
    {
      key: "Response",
      title: "Response",
      panelComponent: (
        <ResponseContentWrapper>
          {error && (
            <ErrorContainer>
              <AdsIcon keepColors name="warning-triangle" />
              <Text style={{ color: "#F22B2B" }} type={TextType.H3}>
                An error occurred
              </Text>

              <ErrorDescriptionText
                className="t--query-error"
                type={TextType.P1}
              >
                {error}
              </ErrorDescriptionText>
              <DebuggerMessage
                onClick={() => {
                  AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
                    source: "QUERY",
                  });
                  setSelectedIndex(1);
                }}
              />
            </ErrorContainer>
          )}
          {hintMessages && hintMessages.length > 0 && (
            <HelpSection>
              {hintMessages.map((msg, index) => (
                <Callout
                  fill
                  key={index}
                  text={msg}
                  variant={Variant.warning}
                />
              ))}
            </HelpSection>
          )}
          {output &&
            (isTableResponse ? (
              <Table data={output} tableBodyHeight={tableBodyHeight} />
            ) : (
              <JSONViewer src={output} />
            ))}
          {!output && !error && (
            <NoResponseContainer>
              <AdsIcon name="no-response" />
              <Text type={TextType.P1}>
                🙌 Click on
                <InlineButton
                  isLoading={isRunning}
                  onClick={responeTabOnRunClick}
                  size={Size.medium}
                  tag="button"
                  text="Run"
                  type="button"
                />
                after adding your query
              </Text>
            </NoResponseContainer>
          )}
        </ResponseContentWrapper>
      ),
    },
    {
      key: "ERROR",
      title: createMessage(DEBUGGER_ERRORS),
      panelComponent: <ErrorLogs />,
    },
    {
      key: "LOGS",
      title: createMessage(DEBUGGER_LOGS),
      panelComponent: <DebuggerLogs searchQuery={actionName} />,
    },
    {
      key: "ENTITY_DEPENDENCIES",
      title: createMessage(INSPECT_ENTITY),
      panelComponent: <EntityDeps />,
    },
  ];

  const onTabSelect = (index: number) => {
    const debuggerTabKeys = ["ERROR", "LOGS"];
    if (
      debuggerTabKeys.includes(responseTabs[index].key) &&
      debuggerTabKeys.includes(responseTabs[selectedIndex].key)
    ) {
      AnalyticsUtil.logEvent("DEBUGGER_TAB_SWITCH", {
        tabName: responseTabs[index].key,
      });
    }

    setSelectedIndex(index);
  };

  return (
    <>
      <CloseEditor />
      <QueryFormContainer onSubmit={handleSubmit}>
        <StyledFormRow>
          <NameWrapper>
            <ActionNameEditor />
          </NameWrapper>
          <ActionsWrapper>
            <MoreActionsMenu
              className="t--more-action-menu"
              id={currentActionConfig ? currentActionConfig.id : ""}
              name={currentActionConfig ? currentActionConfig.name : ""}
              pageId={pageId}
            />
            <DropdownSelect>
              <DropdownField
                className={"t--switch-datasource"}
                components={{ MenuList, Option: CustomOption, SingleValue }}
                maxMenuHeight={200}
                name="datasource.id"
                options={DATASOURCES_OPTIONS}
                placeholder="Datasource"
                width={232}
              />
            </DropdownSelect>
            <OnboardingIndicator
              step={OnboardingStep.EXAMPLE_DATABASE}
              width={75}
            >
              <Button
                className="t--run-query"
                isLoading={isRunning}
                onClick={onRunClick}
                size={Size.medium}
                tag="button"
                text="Run"
                type="button"
              />
            </OnboardingIndicator>
          </ActionsWrapper>
        </StyledFormRow>
        <Wrapper>
          <SecondaryWrapper>
            <TabContainerView>
              {documentationLink && (
                <DocumentationLink
                  className="t--datasource-documentation-link"
                  onClick={(e: React.MouseEvent) => handleDocumentationClick(e)}
                >
                  {"Documentation "}
                  <StyledOpenDocsIcon icon="document-open" />
                </DocumentationLink>
              )}
              <TabComponent
                tabs={[
                  {
                    key: "query",
                    title: "Query",
                    panelComponent: (
                      <SettingsWrapper>
                        {editorConfig && editorConfig.length > 0 ? (
                          editorConfig.map(renderEachConfig(formName))
                        ) : (
                          <>
                            <ErrorMessage>
                              An unexpected error occurred
                            </ErrorMessage>
                            <Tag
                              intent="warning"
                              interactive
                              minimal
                              onClick={() => window.location.reload()}
                              round
                            >
                              Refresh
                            </Tag>
                          </>
                        )}
                        {dataSources.length === 0 && (
                          <NoDataSourceContainer>
                            <p className="font18">
                              Seems like you don’t have any Datasources to
                              create a query
                            </p>
                            <EditorButton
                              filled
                              icon="plus"
                              intent="primary"
                              onClick={() => onCreateDatasourceClick()}
                              size="small"
                              text="Add a Datasource"
                            />
                          </NoDataSourceContainer>
                        )}
                      </SettingsWrapper>
                    ),
                  },
                  {
                    key: "settings",
                    title: "Settings",
                    panelComponent: (
                      <SettingsWrapper>
                        <ActionSettings
                          actionSettingsConfig={settingConfig}
                          formName={formName}
                        />
                      </SettingsWrapper>
                    ),
                  },
                ]}
              />
            </TabContainerView>

            <TabbedViewContainer ref={panelRef}>
              <Resizable
                panelRef={panelRef}
                setContainerDimensions={(height: number) =>
                  setTableBodyHeightHeight(height)
                }
              />
              {output && !!output.length && (
                <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
                  <ResultsCount>
                    <Text type={TextType.P3}>
                      Result:
                      <Text type={TextType.H5}>{`${output.length} Record${
                        output.length > 1 ? "s" : ""
                      }`}</Text>
                    </Text>
                  </ResultsCount>
                </Boxed>
              )}

              <TabComponent
                onSelect={onTabSelect}
                selectedIndex={selectedIndex}
                tabs={responseTabs}
              />
            </TabbedViewContainer>
          </SecondaryWrapper>
          <SidebarWrapper show={!!output}>
            <ActionRightPane
              actionName={actionName}
              hasResponse={!!output}
              suggestedWidgets={executedQueryData?.suggestedWidgets}
            />
          </SidebarWrapper>
        </Wrapper>
      </QueryFormContainer>
    </>
  );
}
