import React from "react";

import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { Intent, IconName } from "@blueprintjs/core";
import { InputType } from "widgets/InputWidget";
import "devextreme/dist/css/dx.common.css";
import "devextreme/dist/css/dx.light.css";
import PieChart, {
  Legend,
  Series,
  Tooltip,
  Format,
  Label,
  Connector,
  Export,
} from "devextreme-react/pie-chart";
import { kindOfProducts } from "mockResponses/DoughnutChartResponse";

/**
 * All design system component specific logic goes here.
 * Ex. Blueprint has a separate numeric input and text input so switching between them goes here
 * Ex. To set the icon as currency, blue print takes in a set of defined types
 * All generic logic like max characters for phone numbers should be 10, should go in the widget
 */

class DxDoughnutChartComponent extends React.Component<
  DxDoughnutChartComponentProps,
  DxDoughnutChartComponentState
> {
  constructor(props: DxDoughnutChartComponentProps) {
    super(props);
    this.state = { showPassword: false };
  }

  setFocusState = (isFocused: boolean) => {
    this.props.onFocusChange(isFocused);
  };

  render() {
    return (
      <PieChart
        id="pie"
        type="doughnut"
        title="Doughnut Chart"
        palette="Soft Pastel"
        dataSource={kindOfProducts}
      >
        <Series argumentField="product">
          <Label visible={true} format="percent">
            <Connector visible={true} />
          </Label>
        </Series>
        <Export enabled={true} />
        <Legend
          //        margin={0}
          horizontalAlignment="right"
          verticalAlignment="top"
        />
        <Tooltip enabled={false} customizeTooltip={this.customizeTooltip}>
          <Format type="millions" />
        </Tooltip>
      </PieChart>
    );
  }

  customizeTooltip(arg: any) {
    return {
      text: `${arg.valueText} - ${(arg.percent * 100).toFixed(2)}%`,
    };
  }
}

export interface DxDoughnutChartComponentState {
  showPassword?: boolean;
}

export interface DxDoughnutChartComponentProps extends ComponentProps {
  value: string;
  inputType: InputType;
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

export default DxDoughnutChartComponent;
