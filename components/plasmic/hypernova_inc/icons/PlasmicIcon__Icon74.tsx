/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon74IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon74Icon(props: Icon74IconProps) {
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
          "M30.065 50.95q-2.1 0-3.75-.945a7.2 7.2 0 0 1-2.595-2.595q-.945-1.65-.945-3.75v-7.92q0-2.1.945-3.75a7 7 0 0 1 2.595-2.595q1.65-.945 3.75-.945t3.75.945a6.9 6.9 0 0 1 2.595 2.595q.945 1.65.945 3.75v7.92q0 2.1-.945 3.75a7 7 0 0 1-2.595 2.595q-1.65.945-3.75.945m0-2.565q1.275 0 2.31-.615t1.65-1.65q.615-1.05.615-2.31v-8.235q0-1.275-.615-2.31t-1.65-1.65a4.44 4.44 0 0 0-2.31-.615q-1.26 0-2.31.615-1.035.615-1.65 1.65t-.615 2.31v8.235q0 1.26.615 2.31.615 1.035 1.65 1.65 1.05.615 2.31.615m20.82 2.115v-3.975h-9.93V43.99l7.124-15.09h3.03l-7.125 15.09h6.9v-6.075h2.7v6.075h2.25v2.535h-2.25V50.5z"
        }
      ></path>
    </svg>
  );
}

export default Icon74Icon;
/* prettier-ignore-end */
