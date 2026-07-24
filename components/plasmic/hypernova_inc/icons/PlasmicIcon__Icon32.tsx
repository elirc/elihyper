/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon32IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon32Icon(props: Icon32IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 27 28"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M13.5 18.129a1.125 1.125 0 1 0 0 2.25 1.125 1.125 0 0 0 0-2.25m-.844-2.25a.844.844 0 0 0 1.688 0zm1.688-7.875a.844.844 0 0 0-1.688 0zm9.562 5.625c0 5.747-4.659 10.406-10.406 10.406v1.688c6.68 0 12.094-5.415 12.094-12.094zM13.5 24.035c-5.747 0-10.406-4.659-10.406-10.406H1.406c0 6.68 5.415 12.094 12.094 12.094zM3.094 13.63c0-5.747 4.659-10.406 10.406-10.406V1.535C6.82 1.535 1.406 6.95 1.406 13.63zM13.5 3.223c5.747 0 10.406 4.659 10.406 10.406h1.688c0-6.68-5.415-12.094-12.094-12.094zm.844 12.656V8.004h-1.688v7.875z"
        }
      ></path>
    </svg>
  );
}

export default Icon32Icon;
/* prettier-ignore-end */
