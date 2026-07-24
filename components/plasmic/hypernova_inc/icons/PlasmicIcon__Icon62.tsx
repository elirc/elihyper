/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon62IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon62Icon(props: Icon62IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 16 16"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <circle cx={"8"} cy={"8"} r={"7.5"} stroke={"#01A8EE"}></circle>
    </svg>
  );
}

export default Icon62Icon;
/* prettier-ignore-end */
