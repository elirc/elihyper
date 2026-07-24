/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon72IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon72Icon(props: Icon72IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 78 78"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <rect
        width={"75"}
        height={"75"}
        x={"1.5"}
        y={"1.5"}
        stroke={"currentColor"}
        strokeWidth={"3"}
        rx={"37.5"}
      ></rect>

      <path
        fill={"currentColor"}
        d={
          "M30.329 50.95q-2.1 0-3.75-.945a7.2 7.2 0 0 1-2.596-2.595q-.945-1.65-.945-3.75v-7.92q0-2.1.945-3.75a7 7 0 0 1 2.595-2.595q1.65-.945 3.75-.945t3.75.945a6.9 6.9 0 0 1 2.595 2.595q.945 1.65.945 3.75v7.92q0 2.1-.945 3.75a7 7 0 0 1-2.595 2.595q-1.65.945-3.75.945m0-2.565q1.275 0 2.31-.615t1.65-1.65q.614-1.05.614-2.31v-8.235q0-1.275-.614-2.31-.615-1.035-1.65-1.65a4.44 4.44 0 0 0-2.31-.615q-1.26 0-2.31.615-1.035.615-1.65 1.65t-.616 2.31v8.235q0 1.26.616 2.31.615 1.035 1.65 1.65 1.05.615 2.31.615m10.889 2.1.015-2.4 9.585-8.625q1.2-1.08 1.605-2.04.42-.975.42-1.995 0-1.245-.57-2.25t-1.56-1.59Q49.738 31 48.493 31q-1.29 0-2.295.615-1.005.6-1.59 1.605-.57 1.005-.555 2.19h-2.73q0-2.04.945-3.6a6.66 6.66 0 0 1 2.565-2.46q1.635-.9 3.705-.9 2.01 0 3.6.93a6.7 6.7 0 0 1 2.505 2.505q.93 1.575.93 3.57 0 1.41-.36 2.445a5.9 5.9 0 0 1-1.08 1.92q-.735.87-1.845 1.86l-7.965 7.155-.345-.9h11.595v2.55z"
        }
      ></path>
    </svg>
  );
}

export default Icon72Icon;
/* prettier-ignore-end */
