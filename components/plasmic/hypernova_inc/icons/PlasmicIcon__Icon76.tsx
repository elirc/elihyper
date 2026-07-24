/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon76IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon76Icon(props: Icon76IconProps) {
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

      <circle
        cx={"39"}
        cy={"39"}
        r={"37.5"}
        stroke={"currentColor"}
        strokeWidth={"3"}
      ></circle>

      <path
        fill={"currentColor"}
        d={
          "M30.8 51.45q-2.1 0-3.75-.945a7.2 7.2 0 0 1-2.596-2.595q-.945-1.65-.945-3.75v-7.92q0-2.1.945-3.75a7 7 0 0 1 2.595-2.595q1.65-.945 3.75-.945t3.75.945a6.9 6.9 0 0 1 2.595 2.595q.945 1.65.945 3.75v7.92q0 2.1-.945 3.75a7 7 0 0 1-2.595 2.595q-1.65.945-3.75.945m0-2.565q1.275 0 2.31-.615t1.65-1.65q.614-1.05.614-2.31v-8.235q0-1.275-.615-2.31t-1.65-1.65a4.44 4.44 0 0 0-2.31-.615q-1.26 0-2.31.615-1.035.615-1.65 1.65t-.615 2.31v8.235q0 1.26.615 2.31.615 1.035 1.65 1.65 1.05.615 2.31.615m17.879 2.565q-1.666 0-3.105-.69a7.4 7.4 0 0 1-2.445-1.89 7.4 7.4 0 0 1-1.44-2.79l2.565-.69q.27 1.065.96 1.845.69.765 1.605 1.2.93.42 1.935.42 1.32 0 2.37-.63 1.065-.645 1.68-1.695.614-1.065.614-2.325 0-1.305-.645-2.355a4.63 4.63 0 0 0-1.695-1.68 4.57 4.57 0 0 0-2.325-.615q-1.424 0-2.444.6-1.005.585-1.59 1.44l-2.37-.9.66-11.295h11.594v2.535H44.299l1.185-1.11-.554 9.045-.586-.765a6.2 6.2 0 0 1 2.145-1.485 6.6 6.6 0 0 1 2.566-.525q2.01 0 3.6.945 1.59.93 2.52 2.55.93 1.605.93 3.615 0 1.995-1.02 3.645a7.76 7.76 0 0 1-2.716 2.625q-1.68.975-3.69.975"
        }
      ></path>
    </svg>
  );
}

export default Icon76Icon;
/* prettier-ignore-end */
