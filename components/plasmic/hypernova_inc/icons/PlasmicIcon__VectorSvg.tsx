/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type VectorSvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function VectorSvgIcon(props: VectorSvgIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 24 12"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M23.725 5.149v-.001l-4.9-4.875a.938.938 0 0 0-1.322 1.329l3.289 3.273H.938a.937.937 0 1 0 0 1.875h19.854l-3.29 3.273a.938.938 0 1 0 1.324 1.329l4.898-4.875h.001a.94.94 0 0 0 0-1.328"
        }
      ></path>
    </svg>
  );
}

export default VectorSvgIcon;
/* prettier-ignore-end */
