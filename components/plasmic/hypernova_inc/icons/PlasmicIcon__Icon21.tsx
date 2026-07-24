/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon21IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon21Icon(props: Icon21IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 27 28"}
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
            "M19.468 9.345c.412.412.412 1.08 0 1.492l-7.076 7.076a1.055 1.055 0 0 1-1.491 0l-3.369-3.369a1.054 1.054 0 1 1 1.492-1.491l2.622 2.622 6.33-6.33a1.055 1.055 0 0 1 1.492 0M27 13.63c0 7.462-6.039 13.5-13.5 13.5S0 21.09 0 13.629 6.039.129 13.5.129 27 6.168 27 13.629m-2.11 0c0-6.296-5.095-11.39-11.39-11.39a11.384 11.384 0 0 0-11.39 11.39c0 6.296 5.095 11.39 11.39 11.39s11.39-5.095 11.39-11.39"
          }
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"#fff"} d={"M0 .129h27v27H0z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Icon21Icon;
/* prettier-ignore-end */
