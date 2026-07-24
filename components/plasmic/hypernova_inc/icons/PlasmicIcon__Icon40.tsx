/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon40IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon40Icon(props: Icon40IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 21 21"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M10.875 17.255a1 1 0 0 0-1.009 0l-4.523 2.641a1.13 1.13 0 0 1-.696.177 1.2 1.2 0 0 1-.636-.235 1.4 1.4 0 0 1-.424-.514 1 1 0 0 1-.06-.69l1.187-4.947a1 1 0 0 0-.33-1L.407 9.357a1.1 1.1 0 0 1-.378-.603 1.14 1.14 0 0 1 .045-.66q.12-.322.363-.529.244-.207.666-.264l5.28-.449a1 1 0 0 0 .833-.598L9.25 1.576q.15-.352.47-.529a1.33 1.33 0 0 1 .65-.176q.333 0 .65.176.32.177.47.529l2.034 4.678a1 1 0 0 0 .833.598l5.28.449q.425.06.666.264.243.205.364.529.12.322.046.66-.075.34-.38.602l-3.976 3.331a1 1 0 0 0-.33 1l1.188 4.947a1 1 0 0 1-.061.69 1.4 1.4 0 0 1-.424.514 1.2 1.2 0 0 1-.636.235 1.1 1.1 0 0 1-.697-.177z"
        }
      ></path>
    </svg>
  );
}

export default Icon40Icon;
/* prettier-ignore-end */
