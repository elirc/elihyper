/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Icon2IconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Icon2Icon(props: Icon2IconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      fill={"none"}
      viewBox={"0 0 27 25"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <path
        fill={"currentColor"}
        d={
          "M27 2.453c0-.925-.806-1.675-1.8-1.675H1.8c-.994 0-1.8.75-1.8 1.675s.806 1.674 1.8 1.674h23.4c.994 0 1.8-.75 1.8-1.674M1.8 10.825h23.4c.994 0 1.8.75 1.8 1.675s-.806 1.675-1.8 1.675H1.8c-.994 0-1.8-.75-1.8-1.675s.806-1.675 1.8-1.675m0 10.048H18c.994 0 1.8.75 1.8 1.674 0 .925-.806 1.675-1.8 1.675H1.8c-.994 0-1.8-.75-1.8-1.675s.806-1.674 1.8-1.674"
        }
      ></path>
    </svg>
  );
}

export default Icon2Icon;
/* prettier-ignore-end */
