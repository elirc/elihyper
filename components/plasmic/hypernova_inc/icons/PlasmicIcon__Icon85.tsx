/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon85IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon85Icon(props: Icon85IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      stroke={"currentColor"}
      strokeLinecap={"round"}
      strokeLinejoin={"round"}
      strokeWidth={"2"}
      viewBox={"0 0 24 24"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path d={"M1 20v-6h6"}></path>

      <path d={"M3.51 9a9 9 0 1 1 2.9 6.86L1 14"}></path>
    </svg>
  );
}

export default Icon85Icon;
/* prettier-ignore-end */
