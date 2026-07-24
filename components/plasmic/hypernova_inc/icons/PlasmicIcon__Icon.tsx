/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type IconIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function IconIcon(props: IconIconProps) {
  const { className, style, title, ...restProps } = props;
  return (
    <svg
      xmlns={"http://www.w3.org/2000/svg"}
      xmlnsXlink={"http://www.w3.org/1999/xlink"}
      fill={"none"}
      viewBox={"0 0 17 17"}
      height={"1em"}
      className={classNames("plasmic-default__svg", className)}
      style={style}
      {...restProps}
    >
      {title && <title>{title}</title>}

      <g clipPath={"url(#a)"}>
        <path
          fill={"currentColor"}
          d={
            "M6.602 8.862a.382.382 0 0 1 0-.724l2.047-.682a3.05 3.05 0 0 0 1.932-1.933l.681-2.046a.382.382 0 0 1 .726 0l.681 2.047a3.06 3.06 0 0 0 1.933 1.932l2.046.682a.382.382 0 0 1 0 .724l-2.047.682a3.05 3.05 0 0 0-1.932 1.932l-.681 2.047a.382.382 0 0 1-.726 0l-.681-2.047a3.06 3.06 0 0 0-1.932-1.932zm-5.389 4.083a.23.23 0 0 1 0-.435l1.228-.41a1.83 1.83 0 0 0 1.16-1.159l.409-1.228a.23.23 0 0 1 .435 0l.409 1.228a1.83 1.83 0 0 0 1.16 1.16l1.227.409a.229.229 0 0 1 0 .435l-1.228.409a1.83 1.83 0 0 0-1.159 1.16l-.409 1.227a.229.229 0 0 1-.435 0l-.41-1.228a1.83 1.83 0 0 0-1.159-1.159zM.105 5.475a.153.153 0 0 1 0-.29l.818-.273a1.22 1.22 0 0 0 .773-.773l.273-.818a.153.153 0 0 1 .29 0l.272.818a1.22 1.22 0 0 0 .774.773l.818.273a.153.153 0 0 1 0 .29l-.818.272a1.22 1.22 0 0 0-.774.774l-.273.817a.153.153 0 0 1-.29 0l-.272-.818a1.22 1.22 0 0 0-.773-.774z"
          }
        ></path>
      </g>

      <defs>
        <clipPath id={"a"}>
          <path fill={"currentColor"} d={"M0 16.955V.044h16.909v16.91z"}></path>
        </clipPath>
      </defs>
    </svg>
  );
}

export default IconIcon;
/* prettier-ignore-end */
