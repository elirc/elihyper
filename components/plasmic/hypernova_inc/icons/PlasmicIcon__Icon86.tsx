/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon86IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon86Icon(props: Icon86IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      stroke={"currentColor"}
      strokeLinecap={"round"}
      strokeLinejoin={"round"}
      strokeWidth={"4"}
      viewBox={"0 0 56 56"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        d={"M28 6C15.193 6 5 16.193 5 29s10.193 23 23 23 23-10.193 23-23"}
      ></path>

      <path d={"M16 16H6V6"}></path>
    </svg>
  );
}

export default Icon86Icon;
/* prettier-ignore-end */
