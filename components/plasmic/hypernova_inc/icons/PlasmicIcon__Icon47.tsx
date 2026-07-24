/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon47IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon47Icon(props: Icon47IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 24 13"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <g clipPath={"url(#a)"}>
        <path
          fill={"#01A8EE"}
          d={
            "M23.725 5.836 18.824.96a.938.938 0 0 0-1.322 1.33l3.289 3.273H.938a.937.937 0 1 0 0 1.875h19.854l-3.29 3.273a.938.938 0 1 0 1.324 1.329l4.898-4.875.001-.001a.94.94 0 0 0 0-1.328"
          }
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"#fff"} d={"M24 .688H0v11.625h24z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Icon47Icon;
/* prettier-ignore-end */
