/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon79IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon79Icon(props: Icon79IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 60 60"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M53.73 23.73C53.73 10.645 43.085 0 30 0S6.27 10.645 6.27 23.73a23.64 23.64 0 0 0 6.152 15.926v13.313h1.758c1.828 0 3.61-.35 5.273-1.023V60h1.758c3.24 0 6.305-1.083 8.789-3.08A13.94 13.94 0 0 0 38.79 60h1.757v-8.054a14 14 0 0 0 5.273 1.023h1.758V39.656A23.64 23.64 0 0 0 53.73 23.73M30 3.517c11.147 0 20.215 9.068 20.215 20.215S41.147 43.945 30 43.945 9.785 34.877 9.785 23.731C9.785 12.583 18.854 3.515 30 3.515M15.938 49.308v-6.475a24 24 0 0 0 3.515 2.15v3.06a10.5 10.5 0 0 1-3.515 1.265m15.317 4.014L30 52.04l-1.255 1.28a10.46 10.46 0 0 1-5.776 3.02v-9.943A23.7 23.7 0 0 0 30 47.46c2.447 0 4.809-.373 7.031-1.063v9.942a10.46 10.46 0 0 1-5.776-3.019m9.292-5.278v-3.06a24 24 0 0 0 3.516-2.151v6.475a10.5 10.5 0 0 1-3.516-1.264"
        }
      ></path>

      <path
        fill={"currentColor"}
        d={
          "M20.185 37.24 30 32.595l9.816 4.645-1.385-10.77 7.451-7.9-10.671-2.011L30 7.03l-5.212 9.528-10.67 2.011 7.45 7.9zm.901-16.406 5.99-1.129L30 14.358l2.925 5.347 5.989 1.13-4.182 4.433.777 6.045L30 28.706l-5.509 2.607.777-6.045z"
        }
      ></path>
    </svg>
  );
}

export default Icon79Icon;
/* prettier-ignore-end */
