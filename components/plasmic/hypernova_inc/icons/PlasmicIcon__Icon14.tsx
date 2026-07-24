/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon14IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon14Icon(props: Icon14IconProps) {
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
            "M25 0c13.785 0 25 11.215 25 25S38.785 50 25 50 0 38.785 0 25 11.215 0 25 0m0 46.875c12.062 0 21.875-9.813 21.875-21.875S37.062 3.125 25 3.125 3.125 12.938 3.125 25 12.938 46.875 25 46.875m-10.48-22.98c-.61.61-.61 1.6 0 2.21l7.813 7.812a1.56 1.56 0 0 0 2.21 0c.61-.61.61-1.599 0-2.21l-5.146-5.145h14.978a1.562 1.562 0 1 0 0-3.125H19.397l5.145-5.145a1.562 1.562 0 1 0-2.21-2.21z"
          }
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"currentColor"} d={"M50 0H0v50h50z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Icon14Icon;
/* prettier-ignore-end */
