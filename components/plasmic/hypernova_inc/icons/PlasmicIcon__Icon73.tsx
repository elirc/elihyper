/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon73IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon73Icon(props: Icon73IconProps) {
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
          "M30.563 50.95q-2.1 0-3.75-.945a7.2 7.2 0 0 1-2.595-2.595q-.945-1.65-.945-3.75v-7.92q0-2.1.945-3.75a7 7 0 0 1 2.595-2.595q1.65-.945 3.75-.945t3.75.945a6.9 6.9 0 0 1 2.595 2.595q.945 1.65.945 3.75v7.92q0 2.1-.945 3.75a7 7 0 0 1-2.595 2.595q-1.65.945-3.75.945m0-2.565q1.275 0 2.31-.615t1.65-1.65q.615-1.05.615-2.31v-8.235q0-1.275-.615-2.31t-1.65-1.65a4.44 4.44 0 0 0-2.31-.615q-1.26 0-2.31.615-1.035.615-1.65 1.65t-.615 2.31v8.235q0 1.26.615 2.31.615 1.035 1.65 1.65 1.05.615 2.31.615m17.414 2.535a7.6 7.6 0 0 1-2.985-.585 7.1 7.1 0 0 1-2.385-1.68 6.8 6.8 0 0 1-1.455-2.595l2.565-.735q.495 1.5 1.65 2.28t2.595.765q1.32-.03 2.28-.6.975-.585 1.5-1.59.54-1.005.54-2.325 0-2.01-1.2-3.255-1.2-1.26-3.15-1.26-.54 0-1.14.15-.585.15-1.095.42l-1.29-2.115 8.01-7.245.345.9H42.007V28.9h12.735v2.565l-6.825 6.54-.03-.945q2.145-.15 3.75.705t2.49 2.445q.9 1.59.9 3.645 0 2.07-.93 3.66a6.8 6.8 0 0 1-2.52 2.505q-1.59.9-3.6.9"
        }
      ></path>
    </svg>
  );
}

export default Icon73Icon;
/* prettier-ignore-end */
