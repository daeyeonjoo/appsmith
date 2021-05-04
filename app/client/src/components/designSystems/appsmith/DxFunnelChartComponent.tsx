import React from "react";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Intent, IconName } from "@blueprintjs/core";
import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.light.css";
import Funnel, {
  Title,
  Margin,
  Export,
  Tooltip,
  Item,
  Border,
  Label,
} from "devextreme-react/funnel";
import { opportunitiesLevel } from "mockResponses/FunnelChartResponse";

class DxFunnelChartComponent extends React.Component<
  DxFunnelChartComponentProps,
  DxFunnelChartComponentState
> {
  constructor(props: DxFunnelChartComponentProps) {
    super(props);
    this.state = { showPassword: false };
  }

  setFocusState = (isFocused: boolean) => {
    this.props.onFocusChange(isFocused);
  };

  formatLabel = (arg: any) => {
    return `<span class="label">${arg.percentText}</span><br/>${arg.item.argument}`;
  };

  render() {
    return (
      <Funnel
        id="funnel"
        dataSource={opportunitiesLevel}
        palette="Soft Pastel"
        argumentField="argument"
        valueField="value"
      >
        <Title text="Website Conversions">
          <Margin bottom={30} />
        </Title>
        <Export enabled={true} />
        <Tooltip enabled={true} format="fixedPoint" />
        <Item>
          <Border visible={true} />
        </Item>
        <Label
          visible={true}
          position="inside"
          backgroundColor="none"
          customizeText={this.formatLabel}
        />
      </Funnel>
    );
  }
}

export interface DxFunnelChartComponentState {
  showPassword?: boolean;
}

export interface DxFunnelChartComponentProps extends ComponentProps {
  value: string;
  disabled?: boolean;
  intent?: Intent;
  defaultValue?: string;
  label: string;
  leftIcon?: IconName;
  allowNumericCharactersOnly?: boolean;
  fill?: boolean;
  errorMessage?: string;
  maxChars?: number;
  maxNum?: number;
  minNum?: number;
  onValueChange: (valueAsString: string) => void;
  stepSize?: number;
  placeholder?: string;
  isLoading: boolean;
  multiline: boolean;
  isInvalid: boolean;
  showError: boolean;
  onFocusChange: (state: boolean) => void;
  disableNewLineOnPressEnterKey?: boolean;
}

export default DxFunnelChartComponent;
