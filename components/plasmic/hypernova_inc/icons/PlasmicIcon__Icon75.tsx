/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon75IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon75Icon(props: Icon75IconProps) {
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
          "M29.684 50.95q-2.1 0-3.75-.945a7.2 7.2 0 0 1-2.595-2.595q-.945-1.65-.945-3.75v-7.92q0-2.1.945-3.75a7 7 0 0 1 2.595-2.595q1.65-.945 3.75-.945t3.75.945a6.9 6.9 0 0 1 2.595 2.595q.945 1.65.945 3.75v7.92q0 2.1-.945 3.75a7 7 0 0 1-2.595 2.595q-1.65.945-3.75.945m0-2.565q1.275 0 2.31-.615t1.65-1.65q.615-1.05.615-2.31v-8.235q0-1.275-.615-2.31t-1.65-1.65a4.44 4.44 0 0 0-2.31-.615q-1.26 0-2.31.615-1.035.615-1.65 1.65t-.615 2.31v8.235q0 1.26.615 2.31.615 1.035 1.65 1.65 1.05.615 2.31.615m18.854 2.565q-2.055 0-3.735-.99a7.4 7.4 0 0 1-2.655-2.7q-.975-1.725-.975-3.885V36.19q0-2.265.975-4.005a7.1 7.1 0 0 1 2.7-2.73q1.725-.99 3.93-.99 1.785 0 3.315.735a6.9 6.9 0 0 1 2.595 2.085l-1.995 1.77q-.645-.945-1.68-1.5A4.66 4.66 0 0 0 48.778 31q-1.425 0-2.535.69a4.9 4.9 0 0 0-1.725 1.8q-.63 1.11-.63 2.4v4.335l-.585-.66q.945-1.35 2.4-2.16a6.37 6.37 0 0 1 3.15-.81q2.01 0 3.6.945a6.8 6.8 0 0 1 2.52 2.565q.93 1.605.93 3.615t-1.005 3.645a7.55 7.55 0 0 1-2.685 2.61q-1.665.975-3.675.975m0-2.58q1.29 0 2.355-.615 1.065-.63 1.68-1.68.63-1.065.63-2.355t-.63-2.355q-.615-1.065-1.68-1.68a4.46 4.46 0 0 0-2.34-.63q-1.29 0-2.355.63-1.05.615-1.68 1.68a4.54 4.54 0 0 0-.63 2.355q0 1.275.615 2.34.63 1.05 1.68 1.68 1.065.63 2.355.63"
        }
      ></path>
    </svg>
  );
}

export default Icon75Icon;
/* prettier-ignore-end */
