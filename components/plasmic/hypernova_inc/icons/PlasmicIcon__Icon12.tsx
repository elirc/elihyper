/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon12IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon12Icon(props: Icon12IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 26 279"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        fillOpacity={".06"}
        d={
          "M-292 20.079c0-11.046 8.954-20 20-20H5.286c11.046 0 20 8.954 20 20V259c0 11.046-8.954 20-20 20H-272c-11.046 0-20-8.954-20-20z"
        }
      ></path>

      <path
        stroke={"currentColor"}
        strokeOpacity={".3"}
        d={
          "M-272 .578H5.286c10.77 0 19.5 8.73 19.5 19.5V259c0 10.77-8.73 19.5-19.5 19.5H-272c-10.769 0-19.5-8.73-19.5-19.5V20.079c0-10.77 8.73-19.5 19.5-19.5Z"
        }
      ></path>
    </svg>
  );
}

export default Icon12Icon;
/* prettier-ignore-end */
