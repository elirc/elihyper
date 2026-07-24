/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type CloseMdSvgrepoComSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function CloseMdSvgrepoComSvgIcon(props: CloseMdSvgrepoComSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 24 24"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        stroke={"currentColor"}
        strokeLinecap={"round"}
        strokeLinejoin={"round"}
        strokeWidth={"2"}
        d={"m18 18-6-6m0 0L6 6m6 6 6-6m-6 6-6 6"}
      ></path>
    </svg>
  );
}

export default CloseMdSvgrepoComSvgIcon;
/* prettier-ignore-end */
