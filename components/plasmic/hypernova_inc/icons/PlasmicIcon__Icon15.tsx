/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon15IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon15Icon(props: Icon15IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 50 50"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <g clipPath={"url(#a)"} opacity={".3"}>
        <path
          fill={"currentColor"}
          d={
            "M25 0C11.215 0 0 11.215 0 25s11.215 25 25 25 25-11.215 25-25S38.785 0 25 0m0 46.875C12.938 46.875 3.125 37.062 3.125 25S12.938 3.125 25 3.125 46.875 12.938 46.875 25 37.062 46.875 25 46.875m10.48-22.98c.61.61.61 1.6 0 2.21l-7.813 7.812a1.56 1.56 0 0 1-2.21 0 1.563 1.563 0 0 1 0-2.21l5.146-5.145H15.625a1.562 1.562 0 1 1 0-3.125h14.978l-5.145-5.145a1.562 1.562 0 1 1 2.21-2.21z"
          }
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"currentColor"} d={"M0 0h50v50H0z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Icon15Icon;
/* prettier-ignore-end */
