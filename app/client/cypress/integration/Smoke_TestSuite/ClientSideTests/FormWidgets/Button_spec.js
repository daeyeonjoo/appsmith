const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const homePage = require("../../../../locators/HomePage.json");
const pages = require("../../../../locators/Pages.json");
const publishPage = require("../../../../locators/publishWidgetspage.json");
const modalWidgetPage = require("../../../../locators/ModalWidget.json");
const datasource = require("../../../../locators/DatasourcesEditor.json");
const queryLocators = require("../../../../locators/QueryEditor.json");

describe("Button Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  beforeEach(() => {
    cy.openPropertyPane("buttonwidget");
  });

  it("Button-Style Validation", function() {
    //Changing the style of the button from the property pane and verify it's color.
    // Change to Secondary button sytle
    cy.changeButtonStyle(2, "rgba(0, 0, 0, 0)", "rgba(0, 0, 0, 0)");
    cy.get(publishPage.backToEditor).click({ force: true });
    // Change to Danger button sytle
    cy.openPropertyPane("buttonwidget");
    cy.changeButtonStyle(3, "rgb(179, 3, 56)", "rgb(139, 2, 43)");
    cy.get(publishPage.backToEditor).click({ force: true });
    // Change to Primary button sytle
    cy.openPropertyPane("buttonwidget");
    cy.changeButtonStyle(1, "rgb(3, 179, 101)", "rgb(2, 139, 78)");
  });

  it("Button-Name validation", function() {
    //changing the Button Name
    cy.widgetText(
      this.data.ButtonName,
      widgetsPage.buttonWidget,
      widgetsPage.buttonWidget + " " + commonlocators.widgetNameTag,
    );

    //Changing the text on the Button
    cy.testJsontext("label", this.data.ButtonLabel);
    cy.get(commonlocators.evaluatedTypeTitle)
      .first()
      .find("span")
      .click();
    cy.EvaluateDataType("string");
    cy.EvaluateCurrentValue(this.data.ButtonLabel);

    cy.assertPageSave();

    //Verify the Button name and label
    cy.get(widgetsPage.buttonWidget).trigger("mouseover");
    cy.get(widgetsPage.buttonWidget + " span.bp3-button-text").should(
      "have.text",
      this.data.ButtonLabel,
    );
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget + " span.bp3-button-text").should(
      "have.text",
      this.data.ButtonLabel,
    );
  });

  it("Button-Disable Validation", function() {
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateDisableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Button-Enable Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.disableCheckbox);
    cy.validateEnableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Toggle JS - Button-Disable Validation", function() {
    //Check the disabled checkbox by using JS widget and Validate
    cy.get(widgetsPage.toggleDisable).click({ force: true });
    cy.testJsontext("disabled", "true");
    cy.validateDisableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateDisableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Toggle JS - Button-Enable Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.testJsontext("disabled", "false");
    cy.validateEnableWidget(
      widgetsPage.buttonWidget,
      commonlocators.disabledField,
    );
    cy.PublishtheApp();
    cy.validateEnableWidget(
      publishPage.buttonWidget,
      commonlocators.disabledField,
    );
  });

  it("Button-Unckeck Visible field Validation", function() {
    //Uncheck the disabled checkbox and validate
    cy.UncheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("not.exist");
  });

  it("Button-Check Visible field Validation", function() {
    //Check the disableed checkbox and Validate
    cy.CheckWidgetProperties(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("be.visible");
  });

  it("Toggle JS - Button-Unckeck Visible field Validation", function() {
    //Uncheck the disabled checkbox using JS and validate
    cy.get(widgetsPage.toggleVisible).click({ force: true });
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("not.exist");
  });

  it("Toggle JS - Button-Check Visible field Validation", function() {
    //Check the disabled checkbox using JS and Validate
    cy.testJsontext("visible", "true");
    cy.PublishtheApp();
    cy.get(publishPage.buttonWidget).should("be.visible");
  });

  it("Button-Copy Verification", function() {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    //Copy button and verify all properties
    cy.copyWidget("buttonwidget", widgetsPage.buttonWidget);

    // cy.PublishtheApp();
  });

  it("Button-Delete Verification", function() {
    // Delete the button widget
    cy.deleteWidget(widgetsPage.buttonWidget);
    cy.PublishtheApp();
    cy.get(widgetsPage.buttonWidget).should("not.exist");
  });

  afterEach(() => {
    cy.goToEditFromPublish();
  });
});
