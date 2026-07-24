/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon46IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon46Icon(props: Icon46IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 17 17"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <g clipPath={"url(#a)"}>
        <path
          fill={"currentColor"}
          fillRule={"evenodd"}
          d={
            "M10.215 15.446c0-.587-.476-1.064-1.064-1.064H7.85a1.064 1.064 0 0 0 0 2.128h1.3c.588 0 1.064-.476 1.064-1.064m-7.978-2.743c.177.014.392.021.608.009a3.02 3.02 0 0 0 2.963 2.436h.406a1.7 1.7 0 0 0 0 .597h-.406a3.62 3.62 0 0 1-3.571-3.042m-.304-.636A2.32 2.32 0 0 1 0 9.781V8.37a2.32 2.32 0 0 1 2.318-2.32h.154a6.047 6.047 0 0 1 12.056 0h.154A2.32 2.32 0 0 1 17 8.369V9.78a2.32 2.32 0 0 1-2.318 2.318h-.684a.514.514 0 0 1-.514-.513v-5.05a4.984 4.984 0 0 0-9.968 0v5.05c0 .2-.115.373-.282.458-.46.16-1.175.044-1.301.023"
          }
          clipRule={"evenodd"}
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"currentColor"} d={"M0 0h17v17H0z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Icon46Icon;
/* prettier-ignore-end */
