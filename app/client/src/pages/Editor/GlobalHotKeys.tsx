import React from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { Hotkey, Hotkeys } from "@blueprintjs/core";
import { HotkeysTarget } from "@blueprintjs/core/lib/esnext/components/hotkeys/hotkeysTarget.js";
import {
  closePropertyPane,
  closeTableFilterPane,
  copyWidget,
  cutWidget,
  deleteSelectedWidget,
  pasteWidget,
} from "actions/widgetActions";
import {
  deselectAllInitAction,
  selectAllWidgetsInCanvasInitAction,
} from "actions/widgetSelectionActions";
import {
  setGlobalSearchFilterContext,
  toggleShowGlobalSearchModal,
} from "actions/globalSearchActions";
import { isMac } from "utils/helpers";
import { getSelectedWidget, getSelectedWidgets } from "selectors/ui";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import { getSelectedText } from "utils/helpers";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WIDGETS_SEARCH_ID } from "constants/Explorer";
import { resetSnipingMode as resetSnipingModeAction } from "actions/propertyPaneActions";
import { showDebugger } from "actions/debuggerActions";

import { setCommentModeInUrl } from "pages/Editor/ToggleModeButton";
import { runActionViaShortcut } from "actions/actionActions";
import {
  filterCategories,
  SearchCategory,
  SEARCH_CATEGORY_ID,
} from "components/editorComponents/GlobalSearch/utils";

type Props = {
  copySelectedWidget: () => void;
  pasteCopiedWidget: () => void;
  deleteSelectedWidget: () => void;
  cutSelectedWidget: () => void;
  toggleShowGlobalSearchModal: (category: SearchCategory) => void;
  resetSnipingMode: () => void;
  openDebugger: () => void;
  closeProppane: () => void;
  closeTableFilterProppane: () => void;
  executeAction: () => void;
  selectAllWidgetsInit: () => void;
  deselectAllWidgets: () => void;
  setGlobalSearchFilterContext: (payload: { category: any }) => void;
  selectedWidget?: string;
  selectedWidgets: string[];
  isDebuggerOpen: boolean;
  children: React.ReactNode;
};

@HotkeysTarget
class GlobalHotKeys extends React.Component<Props> {
  public stopPropagationIfWidgetSelected(e: KeyboardEvent): boolean {
    const multipleWidgetsSelected =
      this.props.selectedWidgets && this.props.selectedWidgets.length;
    const singleWidgetSelected =
      this.props.selectedWidget &&
      this.props.selectedWidget != MAIN_CONTAINER_WIDGET_ID;
    if (
      (singleWidgetSelected || multipleWidgetsSelected) &&
      !getSelectedText()
    ) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    return false;
  }

  public onOnmnibarHotKeyDown(e: KeyboardEvent) {
    e.preventDefault();
    // this.props.setGlobalSearchFilterContext({
    //   category: filterCategories[SEARCH_CATEGORY_ID.NAVIGATION],
    // });
    this.props.toggleShowGlobalSearchModal(
      filterCategories[SEARCH_CATEGORY_ID.NAVIGATION],
    );
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "HOTKEY_COMBO" });
  }

  public renderHotkeys() {
    return (
      <Hotkeys>
        <Hotkey
          combo="mod + f"
          global
          label="Search entities"
          onKeyDown={(e: any) => {
            const widgetSearchInput = document.getElementById(
              WIDGETS_SEARCH_ID,
            );
            if (widgetSearchInput) {
              widgetSearchInput.focus();
              e.preventDefault();
              e.stopPropagation();
            }
          }}
        />
        <Hotkey
          allowInInput={false}
          combo="mod + k"
          global
          label="Show omnibar"
          onKeyDown={(e) => this.onOnmnibarHotKeyDown(e)}
        />
        <Hotkey
          allowInInput={false}
          combo="mod + p"
          global
          label="Show omnibar"
          onKeyDown={(e) => this.onOnmnibarHotKeyDown(e)}
        />
        <Hotkey
          combo="mod + d"
          global
          group="Canvas"
          label="Open Debugger"
          onKeyDown={() => {
            this.props.openDebugger();
            if (this.props.isDebuggerOpen) {
              AnalyticsUtil.logEvent("OPEN_DEBUGGER", {
                source: "CANVAS",
              });
            }
          }}
          preventDefault
        />
        <Hotkey
          combo="mod + c"
          global
          group="Canvas"
          label="Copy Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.copySelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="mod + v"
          global
          group="Canvas"
          label="Paste Widget"
          onKeyDown={() => {
            this.props.pasteCopiedWidget();
          }}
        />
        <Hotkey
          combo="backspace"
          global
          group="Canvas"
          label="Delete Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e) && isMac()) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="del"
          global
          group="Canvas"
          label="Delete Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.deleteSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="mod + x"
          global
          group="Canvas"
          label="Cut Widget"
          onKeyDown={(e: any) => {
            if (this.stopPropagationIfWidgetSelected(e)) {
              this.props.cutSelectedWidget();
            }
          }}
        />
        <Hotkey
          combo="mod + a"
          global
          group="Canvas"
          label="Select all Widget"
          onKeyDown={(e: any) => {
            this.props.selectAllWidgetsInit();
            e.preventDefault();
          }}
        />
        <Hotkey
          combo="esc"
          global
          group="Canvas"
          label="Deselect all Widget"
          onKeyDown={(e: any) => {
            setCommentModeInUrl(false);
            this.props.resetSnipingMode();
            this.props.deselectAllWidgets();
            this.props.closeProppane();
            this.props.closeTableFilterProppane();
            e.preventDefault();
          }}
        />
        <Hotkey
          combo="v"
          global
          label="Edit Mode"
          onKeyDown={(e: any) => {
            setCommentModeInUrl(false);
            this.props.resetSnipingMode();
            e.preventDefault();
          }}
        />
        <Hotkey
          combo="c"
          global
          label="Comment Mode"
          onKeyDown={() => setCommentModeInUrl(true)}
        />
        <Hotkey
          allowInInput
          combo="mod + enter"
          global
          label="Execute Action"
          onKeyDown={this.props.executeAction}
          preventDefault
          stopPropagation
        />
      </Hotkeys>
    );
  }

  render() {
    return <div>{this.props.children}</div>;
  }
}

const mapStateToProps = (state: AppState) => ({
  selectedWidget: getSelectedWidget(state),
  selectedWidgets: getSelectedWidgets(state),
  isDebuggerOpen: state.ui.debugger.isOpen,
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    copySelectedWidget: () => dispatch(copyWidget(true)),
    pasteCopiedWidget: () => dispatch(pasteWidget()),
    deleteSelectedWidget: () => dispatch(deleteSelectedWidget(true)),
    cutSelectedWidget: () => dispatch(cutWidget()),
    toggleShowGlobalSearchModal: (category: SearchCategory) =>
      dispatch(toggleShowGlobalSearchModal(category)),
    resetSnipingMode: () => dispatch(resetSnipingModeAction()),
    openDebugger: () => dispatch(showDebugger()),
    closeProppane: () => dispatch(closePropertyPane()),
    closeTableFilterProppane: () => dispatch(closeTableFilterPane()),
    selectAllWidgetsInit: () => dispatch(selectAllWidgetsInCanvasInitAction()),
    deselectAllWidgets: () => dispatch(deselectAllInitAction()),
    executeAction: () => dispatch(runActionViaShortcut()),
    setGlobalSearchFilterContext: (payload: { category: any }) =>
      dispatch(setGlobalSearchFilterContext(payload)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(GlobalHotKeys);
