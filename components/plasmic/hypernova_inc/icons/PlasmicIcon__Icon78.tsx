/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon78IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon78Icon(props: Icon78IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 60 60"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <g fill={"currentColor"} clipPath={"url(#a)"}>
        <path
          d={
            "M6.92 46.798a11.67 11.67 0 0 1-5.739-1.509c-.913-.47-1.267-1.647-.721-2.532 1.813-2.897 2.467-6.438 1.637-9.768-.86-3.453-2.105-6.36-2.096-10.015C.031 10.15 10.705-.244 23.514.004c12.373.25 22.57 10.65 22.57 23.026 0 16.163-16.94 27.51-31.893 21.27a11.83 11.83 0 0 1-7.271 2.498M4.484 42.85c2.817.875 5.985.176 8.157-1.924a1.78 1.78 0 0 1 2.008-.326c12.803 6.12 27.87-3.474 27.87-17.571 0-10.52-8.558-19.25-19.076-19.462-10.84-.215-19.852 8.564-19.878 19.414-.008 3.471 1.346 6.246 2.086 9.534.78 3.466.37 7.13-1.167 10.335"
          }
        ></path>

        <path
          d={
            "M53.08 60c-2.618 0-5.209-.88-7.27-2.498-7.952 3.32-17.412 1.808-23.933-3.824a1.782 1.782 0 0 1 2.33-2.697c5.783 4.994 14.253 6.118 21.145 2.823a1.78 1.78 0 0 1 2.008.326c2.172 2.1 5.34 2.8 8.157 1.924a15.84 15.84 0 0 1-.659-12.123l.041-.106a19.3 19.3 0 0 0 1.537-7.64c-.011-4.674-1.566-8.997-4.496-12.502a1.782 1.782 0 0 1 2.735-2.286c3.42 4.093 5.312 9.342 5.325 14.78a22.9 22.9 0 0 1-1.796 8.984c-1.26 3.646-.68 7.55 1.337 10.798.546.886.192 2.063-.721 2.533A11.7 11.7 0 0 1 53.08 60M23.043 25.938a2.82 2.82 0 1 0 .001-5.639 2.82 2.82 0 0 0-.001 5.639m-10.39 0a2.82 2.82 0 1 0 .001-5.639 2.82 2.82 0 0 0-.001 5.639m20.778 0a2.82 2.82 0 1 0 .002-5.639 2.82 2.82 0 0 0-.002 5.639"
          }
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"currentColor"} d={"M0 0h60v60H0z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default Icon78Icon;
/* prettier-ignore-end */
