import React, { useState } from "react";
import { MenuItem, Classes, Button as BButton } from "@blueprintjs/core";
import {
  CellWrapper,
  CellCheckboxWrapper,
  CellCheckbox,
  ActionWrapper,
  SortIconWrapper,
  DraggableHeaderWrapper,
} from "./TableStyledWrappers";
import { ColumnAction } from "components/propertyControls/ColumnActionSelectorControl";

import {
  ColumnTypes,
  CellAlignmentTypes,
  VerticalAlignmentTypes,
  ColumnProperties,
  CellLayoutProperties,
  TableStyles,
} from "components/designSystems/appsmith/TableComponent/Constants";
import { isString, isEmpty, findIndex } from "lodash";
import PopoverVideo from "components/designSystems/appsmith/PopoverVideo";
import Button from "components/editorComponents/Button";
import AutoToolTipComponent from "components/designSystems/appsmith/TableComponent/AutoToolTipComponent";
import { ControlIcons } from "icons/ControlIcons";
import { AnyStyledComponent } from "styled-components";
import styled from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import { DropdownOption } from "widgets/DropdownWidget";
import { IconNames } from "@blueprintjs/icons";
import { Select, IItemRendererProps } from "@blueprintjs/select";
import { FontStyleTypes, TextSizes } from "constants/WidgetConstants";
import { noop } from "utils/AppsmithUtils";

export const renderCell = (
  value: any,
  columnType: string,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
  tableWidth: number,
  isCellVisible: boolean,
  onClick: () => void = noop,
  isSelected?: boolean,
) => {
  switch (columnType) {
    case ColumnTypes.IMAGE:
      if (!value) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isCellVisible={isCellVisible}
            isHidden={isHidden}
          />
        );
      } else if (!isString(value)) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isCellVisible={isCellVisible}
            isHidden={isHidden}
          >
            <div>Invalid Image </div>
          </CellWrapper>
        );
      }
      // better regex: /(?<!base64),/g ; can't use due to safari incompatibility
      const imageSplitRegex = /[^(base64)],/g;
      const imageUrlRegex = /(http(s?):)([/|.|\w|\s|-])*\.(?:jpeg|jpg|gif|png)??(?:&?[^=&]*=[^=&]*)*/;
      const base64ImageRegex = /^data:image\/.*;base64/;
      return (
        <CellWrapper
          cellProperties={cellProperties}
          isCellVisible={isCellVisible}
          isHidden={isHidden}
        >
          {value
            .toString()
            // imageSplitRegex matched "," and char before it, so add space before ","
            .replace(imageSplitRegex, (match) =>
              match.length > 1 ? `${match.charAt(0)} ,` : " ,",
            )
            .split(imageSplitRegex)
            .map((item: string, index: number) => {
              if (imageUrlRegex.test(item) || base64ImageRegex.test(item)) {
                return (
                  <div
                    className="image-cell-wrapper"
                    key={index}
                    onClick={(e) => {
                      if (isSelected) {
                        e.stopPropagation();
                      }
                      onClick();
                    }}
                  >
                    <div
                      className="image-cell"
                      style={{ backgroundImage: `url("${item}")` }}
                    />
                  </div>
                );
              } else {
                return <div key={index}>Invalid Image</div>;
              }
            })}
        </CellWrapper>
      );
    case ColumnTypes.VIDEO:
      const youtubeRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|\?v=)([^#&?]*).*/;
      if (!value) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isCellVisible={isCellVisible}
            isHidden={isHidden}
          />
        );
      } else if (isString(value) && youtubeRegex.test(value)) {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            className="video-cell"
            isCellVisible={isCellVisible}
            isHidden={isHidden}
          >
            <PopoverVideo url={value} />
          </CellWrapper>
        );
      } else {
        return (
          <CellWrapper
            cellProperties={cellProperties}
            isCellVisible={isCellVisible}
            isHidden={isHidden}
          >
            Invalid Video Link
          </CellWrapper>
        );
      }
    default:
      return (
        <AutoToolTipComponent
          cellProperties={cellProperties}
          columnType={columnType}
          isCellVisible={isCellVisible}
          isHidden={isHidden}
          tableWidth={tableWidth}
          title={!!value ? value.toString() : ""}
        >
          {value && columnType === ColumnTypes.URL && cellProperties.displayText
            ? cellProperties.displayText
            : !!value
            ? value.toString()
            : ""}
        </AutoToolTipComponent>
      );
  }
};

interface RenderActionProps {
  isSelected: boolean;
  columnActions?: ColumnAction[];
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}

export const renderActions = (
  props: RenderActionProps,
  isHidden: boolean,
  cellProperties: CellLayoutProperties,
) => {
  if (!props.columnActions)
    return (
      <CellWrapper
        cellProperties={cellProperties}
        isCellVisible={props.isCellVisible}
        isHidden={isHidden}
      />
    );

  return (
    <CellWrapper
      cellProperties={cellProperties}
      isCellVisible={props.isCellVisible}
      isHidden={isHidden}
    >
      {props.columnActions.map((action: ColumnAction, index: number) => {
        return (
          <TableAction
            action={action}
            backgroundColor={props.backgroundColor}
            buttonLabelColor={props.buttonLabelColor}
            isCellVisible={props.isCellVisible}
            isDisabled={props.isDisabled}
            isSelected={props.isSelected}
            key={index}
            onCommandClick={props.onCommandClick}
          />
        );
      })}
    </CellWrapper>
  );
};

function TableAction(props: {
  isSelected: boolean;
  action: ColumnAction;
  backgroundColor: string;
  buttonLabelColor: string;
  isDisabled: boolean;
  isCellVisible: boolean;
  onCommandClick: (dynamicTrigger: string, onComplete: () => void) => void;
}) {
  const [loading, setLoading] = useState(false);
  const onComplete = () => {
    setLoading(false);
  };

  return (
    <ActionWrapper
      background={props.backgroundColor}
      buttonLabelColor={props.buttonLabelColor}
      onClick={(e) => {
        if (props.isSelected) {
          e.stopPropagation();
        }
      }}
    >
      {props.isCellVisible ? (
        <Button
          disabled={props.isDisabled}
          filled
          intent="PRIMARY_BUTTON"
          loading={loading}
          onClick={() => {
            setLoading(true);
            props.onCommandClick(props.action.dynamicTrigger, onComplete);
          }}
          size="small"
          text={props.action.label}
        />
      ) : null}
    </ActionWrapper>
  );
}

function CheckBoxLineIcon() {
  return (
    <svg
      className="th-svg t--table-multiselect-header-half-check-svg"
      fill="none"
      height="15"
      width="15"
    >
      <path
        d="M11.183673404886235,7.5 H3.81632661819458 "
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />
    </svg>
  );
}

function CheckBoxCheckIcon() {
  return (
    <svg className="th-svg" fill="none" height="15" width="15">
      <path
        d="M3.523326302644791,8.068102895600848 L5.7957131234862,10.340476082148596 L11.476673358442884,4.659524027768102 "
        stroke="white"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity="0.9"
      />
    </svg>
  );
}

export const renderCheckBoxCell = (isChecked: boolean) => (
  <CellCheckboxWrapper
    className="td t--table-multiselect"
    isCellVisible
    isChecked={isChecked}
  >
    <CellCheckbox>{isChecked && <CheckBoxCheckIcon />}</CellCheckbox>
  </CellCheckboxWrapper>
);

export const renderCheckBoxHeaderCell = (
  onClick: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void,
  checkState: number | null,
) => (
  <CellCheckboxWrapper
    className="th header-reorder t--table-multiselect-header"
    isChecked={!!checkState}
    onClick={onClick}
    role="columnheader"
    style={{ padding: "0px", justifyContent: "center" }}
  >
    <CellCheckbox>
      {checkState === 1 && <CheckBoxCheckIcon />}
      {checkState === 2 && <CheckBoxLineIcon />}
    </CellCheckbox>
  </CellCheckboxWrapper>
);

export const renderEmptyRows = (
  rowCount: number,
  columns: any,
  tableWidth: number,
  page: any,
  prepareRow: any,
  multiRowSelection = false,
) => {
  const rows: string[] = new Array(rowCount).fill("");
  if (page.length) {
    const row = page[0];
    return rows.map((item: string, index: number) => {
      prepareRow(row);
      const rowProps = {
        ...row.getRowProps(),
        style: { display: "flex" },
      };
      return (
        <div {...rowProps} className="tr" key={index}>
          {multiRowSelection && renderCheckBoxCell(false)}
          {row.cells.map((cell: any, cellIndex: number) => {
            return (
              <div {...cell.getCellProps()} className="td" key={cellIndex} />
            );
          })}
        </div>
      );
    });
  } else {
    const tableColumns = columns.length
      ? columns
      : new Array(3).fill({ width: tableWidth / 3, isHidden: false });
    return (
      <>
        {rows.map((row: string, index: number) => {
          return (
            <div
              className="tr"
              key={index}
              style={{
                display: "flex",
                flex: "1 0 auto",
              }}
            >
              {multiRowSelection && renderCheckBoxCell(false)}
              {tableColumns.map((column: any, colIndex: number) => {
                return (
                  <div
                    className="td"
                    key={colIndex}
                    style={{
                      width: column.width + "px",
                      boxSizing: "border-box",
                      flex: `${column.width} 0 auto`,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </>
    );
  }
};

const AscendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 12px;
  cursor: pointer;
  transform: rotate(180deg);
  && svg {
    path {
      fill: ${(props) => props.theme.colors.secondary};
    }
  }
`;

const DescendingIcon = styled(ControlIcons.SORT_CONTROL as AnyStyledComponent)`
  padding: 0;
  position: relative;
  top: 3px;
  cursor: pointer;
  && svg {
    path {
      fill: ${(props) => props.theme.colors.secondary};
    }
  }
`;

export function TableHeaderCell(props: {
  columnName: string;
  columnIndex: number;
  isHidden: boolean;
  isAscOrder?: boolean;
  sortTableColumn: (columnIndex: number, asc: boolean) => void;
  isResizingColumn: boolean;
  column: any;
}) {
  const { column } = props;
  const handleSortColumn = () => {
    if (props.isResizingColumn) return;
    let columnIndex = props.columnIndex;
    if (props.isAscOrder === true) {
      columnIndex = -1;
    }
    const sortOrder =
      props.isAscOrder === undefined ? false : !props.isAscOrder;
    props.sortTableColumn(columnIndex, sortOrder);
  };

  return (
    <div
      {...column.getHeaderProps()}
      className="th header-reorder"
      onClick={handleSortColumn}
    >
      {props.isAscOrder !== undefined ? (
        <SortIconWrapper>
          {props.isAscOrder ? (
            <AscendingIcon height={16} width={16} />
          ) : (
            <DescendingIcon height={16} width={16} />
          )}
        </SortIconWrapper>
      ) : null}
      <DraggableHeaderWrapper
        className={
          !props.isHidden
            ? `draggable-header ${
                props.isAscOrder !== undefined ? "sorted" : ""
              }`
            : "hidden-header"
        }
        horizontalAlignment={column.columnProperties.horizontalAlignment}
      >
        {props.columnName}
      </DraggableHeaderWrapper>
      <div
        {...column.getResizerProps()}
        className={`resizer ${column.isResizing ? "isResizing" : ""}`}
        onClick={(e: React.MouseEvent<HTMLElement>) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      />
    </div>
  );
}

export function getDefaultColumnProperties(
  accessor: string,
  index: number,
  widgetName: string,
  isDerived?: boolean,
): ColumnProperties {
  const columnProps = {
    index: index,
    width: 150,
    id: accessor,
    horizontalAlignment: CellAlignmentTypes.LEFT,
    verticalAlignment: VerticalAlignmentTypes.CENTER,
    columnType: ColumnTypes.TEXT,
    textColor: Colors.THUNDER,
    textSize: TextSizes.PARAGRAPH,
    fontStyle: FontStyleTypes.REGULAR,
    enableFilter: true,
    enableSort: true,
    isVisible: true,
    isDisabled: false,
    isCellVisible: true,
    isDerived: !!isDerived,
    label: accessor,
    computedValue: isDerived
      ? ""
      : `{{${widgetName}.sanitizedTableData.map((currentRow) => ( currentRow.${accessor}))}}`,
  };

  return columnProps;
}

export function getTableStyles(props: TableStyles) {
  return {
    textColor: props.textColor,
    textSize: props.textSize,
    fontStyle: props.fontStyle,
    cellBackground: props.cellBackground,
    verticalAlignment: props.verticalAlignment,
    horizontalAlignment: props.horizontalAlignment,
  };
}

const SingleDropDown = Select.ofType<DropdownOption>();

const StyledSingleDropDown = styled(SingleDropDown)`
  div {
    padding: 0 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  span {
    width: 100%;
    height: 100%;
    position: relative;
  }
  .${Classes.BUTTON} {
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    box-shadow: none;
    background: transparent;
    min-height: 32px;
  }
  .${Classes.BUTTON_TEXT} {
    text-overflow: ellipsis;
    text-align: left;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
  }
  && {
    .${Classes.ICON} {
      width: fit-content;
      color: ${Colors.SLATE_GRAY};
    }
  }
`;

export const renderDropdown = (props: {
  options: DropdownOption[];
  isCellVisible: boolean;
  onItemSelect: (onOptionChange: string, item: DropdownOption) => void;
  onOptionChange: string;
  selectedIndex?: number;
}) => {
  const isOptionSelected = (selectedOption: DropdownOption) => {
    const optionIndex = findIndex(props.options, (option) => {
      return option.value === selectedOption.value;
    });
    return optionIndex === props.selectedIndex;
  };
  const renderSingleSelectItem = (
    option: DropdownOption,
    itemProps: IItemRendererProps,
  ) => {
    if (!itemProps.modifiers.matchesPredicate) {
      return null;
    }
    if (!props.isCellVisible) {
      return null;
    }
    const isSelected: boolean = isOptionSelected(option);
    return (
      <MenuItem
        active={isSelected}
        className="single-select"
        key={option.value}
        onClick={itemProps.handleClick}
        text={option.label}
      />
    );
  };
  return (
    <div
      onClick={(e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation();
      }}
      style={{ height: "100%" }}
    >
      <StyledSingleDropDown
        filterable={false}
        itemRenderer={renderSingleSelectItem}
        items={props.options}
        onItemSelect={(item: DropdownOption) => {
          props.onItemSelect(props.onOptionChange, item);
        }}
        popoverProps={{
          minimal: true,
          usePortal: true,
          popoverClassName: "select-popover-wrapper",
        }}
      >
        <BButton
          rightIcon={IconNames.CHEVRON_DOWN}
          text={
            !isEmpty(props.options) &&
            props.selectedIndex !== undefined &&
            props.selectedIndex > -1
              ? props.options[props.selectedIndex].label
              : "-- Select --"
          }
        />
      </StyledSingleDropDown>
    </div>
  );
};
