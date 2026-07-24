/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon84IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon84Icon(props: Icon84IconProps) {
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

      <path d={"M23 4v6h-6"}></path>

      <path d={"M20.49 15a9 9 0 1 1-2.9-6.86L23 10"}></path>
    </svg>
  );
}

export default Icon84Icon;
/* prettier-ignore-end */
