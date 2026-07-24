/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon88IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon88Icon(props: Icon88IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      viewBox={"0 0 64 60"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"none"}
        stroke={"currentColor"}
        strokeLinecap={"round"}
        strokeLinejoin={"round"}
        strokeWidth={"4"}
        d={"M32 6a20 20 0 1 1-20 24M32 6H18m0 0 6-6m-6 6 6 6"}
      ></path>
    </svg>
  );
}

export default Icon88Icon;
/* prettier-ignore-end */
