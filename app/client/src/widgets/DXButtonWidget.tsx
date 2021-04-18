import React from "react";
import BaseWidget, { WidgetProps, WidgetState } from "./BaseWidget";
import { WidgetType } from "constants/WidgetConstants";
import { ButtonType } from "components/designSystems/blueprint/ButtonComponent";
import { EventType } from "constants/ActionConstants";
import {
  BASE_WIDGET_VALIDATION,
  WidgetPropertyValidationType,
} from "utils/WidgetValidation";
import { VALIDATION_TYPES } from "constants/WidgetValidation";
import * as Sentry from "@sentry/react";
import withMeta, { WithMeta } from "./MetaHOC";
import { Button } from "devextreme-react/button";

class DXButtonWidget extends BaseWidget<
  DXButtonWidgetProps,
  DXButtonWidgetState
> {
  onButtonClickBound: (event: React.MouseEvent<HTMLElement>) => void;
  clickWithRecaptchaBound: (token: string) => void;
  onDxButtonClickBound: (e: any) => void;

  constructor(props: DXButtonWidgetProps) {
    super(props);
    this.onButtonClickBound = this.onButtonClick.bind(this);
    this.clickWithRecaptchaBound = this.clickWithRecaptcha.bind(this);
    this.onDxButtonClickBound = this.dxButtonClick.bind(this);
    this.state = {
      isLoading: false,
    };
  }

  static getPropertyPaneConfig() {
    return [
      {
        sectionName: "General",
        children: [
          {
            propertyName: "text",
            label: "Label",
            helpText: "Sets the label of the button",
            controlType: "INPUT_TEXT",
            placeholderText: "Enter label text",
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "buttonStyle",
            label: "DXButton Type",
            controlType: "DROP_DOWN",
            helpText: "Specifies the button type",
            options: [
              {
                label: "Default",
                value: "default",
              },
              {
                label: "Normal",
                value: "normal",
              },
              {
                label: "Success",
                value: "success",
              },
              {
                label: "Back",
                value: "back",
              },
              {
                label: "Danger",
                value: "danger",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "stylingMode",
            label: "DXButton Styling Mode",
            controlType: "DROP_DOWN",
            helpText: "Specifies how to button is styled",
            options: [
              {
                label: "Text",
                value: "text",
              },
              {
                label: "Outlined",
                value: "outlined",
              },
              {
                label: "Contained",
                value: "contained",
              },
            ],
            isBindProperty: false,
            isTriggerProperty: false,
          },
          {
            propertyName: "isVisible",
            label: "Visible",
            helpText: "Controls the visibility of the widget",
            controlType: "SWITCH",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          {
            propertyName: "isDisabled",
            label: "Disabled",
            controlType: "SWITCH",
            helpText: "Disables clicks to this widget",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: false,
          },
          // {
          //   propertyName: "googleRecaptchaKey",
          //   label: "Google Recaptcha Key",
          //   helpText: "Sets Google Recaptcha v3 site key for button",
          //   controlType: "INPUT_TEXT",
          //   placeholderText: "Enter google recaptcha key",
          //   isBindProperty: true,
          //   isTriggerProperty: false,
          // },
        ],
      },
      {
        sectionName: "Actions",
        children: [
          {
            helpText: "Triggers an action when the button is clicked",
            propertyName: "onClick",
            label: "onClick",
            controlType: "ACTION_SELECTOR",
            isJSConvertible: true,
            isBindProperty: true,
            isTriggerProperty: true,
          },
        ],
      },
    ];
  }

  static getPropertyValidationMap(): WidgetPropertyValidationType {
    return {
      ...BASE_WIDGET_VALIDATION,
      text: VALIDATION_TYPES.TEXT,
      buttonStyle: VALIDATION_TYPES.TEXT,

      // onClick: VALIDATION_TYPES.ACTION_SELECTOR,
    };
  }

  static getMetaPropertiesMap(): Record<string, any> {
    return {
      recaptchaToken: undefined,
    };
  }

  onButtonClick() {
    if (this.props.onClick) {
      this.setState({
        isLoading: true,
      });
      super.executeAction({
        dynamicString: this.props.onClick,
        event: {
          type: EventType.ON_CLICK,
          callback: this.handleActionComplete,
        },
      });
    }
  }

  clickWithRecaptcha(token: string) {
    if (this.props.onClick) {
      this.setState({
        isLoading: true,
      });
    }
    this.props.updateWidgetMetaProperty("recaptchaToken", token, {
      dynamicString: this.props.onClick,
      event: {
        type: EventType.ON_CLICK,
        callback: this.handleActionComplete,
      },
    });
  }

  handleActionComplete = () => {
    this.setState({
      isLoading: false,
    });
  };

  getPageView() {
    return (
      <Button
        width={120}
        text={this.props.text}
        type={this.props.buttonStyle}
        stylingMode={this.props.stylingMode}
        disabled={this.props.isDisabled}
        onClick={!this.props.isDisabled ? this.onDxButtonClickBound : undefined}
        visible={this.props.isVisible}

        //buttonStyle={this.props.buttonStyle}
        //widgetId={this.props.widgetId}
        //key={this.props.widgetId}
        //widgetName={this.props.widgetName}

        //onClick={!this.props.isDisabled ? this.onButtonClickBound : undefined}
        //isLoading={this.props.isLoading || this.state.isLoading}
        //type={this.props.buttonType || ButtonType.BUTTON}
        //googleRecaptchaKey={this.props.googleRecaptchaKey}
        //clickWithRecaptcha={this.clickWithRecaptchaBound}

        // onClick={this.onClick}
      />
    );
  }

  dxButtonClick(e: any) {
    this.onButtonClick();
  }

  getWidgetType(): WidgetType {
    return "DX_BUTTON_WIDGET";
  }
}

type DXButtonType = "back" | "danger" | "default" | "normal" | "success";
type DXButtonStylingMode = "text" | "outlined" | "contained";

export interface DXButtonWidgetProps extends WidgetProps, WithMeta {
  text?: string;
  buttonStyle?: DXButtonType;
  stylingMode?: DXButtonStylingMode;
  onClick?: string;
  isDisabled?: boolean;
  isVisible?: boolean;
  buttonType?: ButtonType;
  googleRecaptchaKey?: string;
}

interface DXButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export default DXButtonWidget;
export const ProfiledDXButtonWidget = Sentry.withProfiler(
  withMeta(DXButtonWidget),
);
