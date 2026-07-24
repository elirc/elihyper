/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */
import React from "react";
import { classNames } from "@plasmicapp/react-web";

export type Fi18896209SvgIconProps = React.ComponentProps<"svg"> & {
  title?: string;
};

export function Fi18896209SvgIcon(props: Fi18896209SvgIconProps) {
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

      <path
        fill={"currentColor"}
        d={
          "M43.247 64.782 39 67.722l-4.247-2.94A58.05 58.05 0 0 1 9.758 18.065l8.314-8.315h41.856l8.313 8.315a58 58 0 0 1-6.965 26.567l3.57 3.57c5.333-9.359 8.279-20.055 8.279-31.14 0-.647-.257-1.266-.714-1.723l-9.75-9.75a2.44 2.44 0 0 0-1.724-.714H17.063c-.647 0-1.267.257-1.724.714l-9.75 9.75a2.44 2.44 0 0 0-.714 1.723A62.92 62.92 0 0 0 31.978 68.79l5.634 3.902a2.44 2.44 0 0 0 2.776 0l5.634-3.902a63 63 0 0 0 8.651-7.223l-3.443-3.443a58 58 0 0 1-7.983 6.658"
        }
      ></path>

      <path
        fill={"currentColor"}
        d={
          "M60.223 47.027a2.437 2.437 0 0 0-3.446 0l-.715.714-1.676-1.677c2.57-3.303 4.116-7.44 4.116-11.939 0-10.752-8.748-19.5-19.5-19.5s-19.5 8.748-19.5 19.5 8.748 19.5 19.5 19.5c4.499 0 8.634-1.546 11.937-4.114l1.677 1.676-.714.715a2.437 2.437 0 0 0 0 3.446l8.74 8.741a5.84 5.84 0 0 0 4.161 1.724 5.85 5.85 0 0 0 4.163-1.726 5.894 5.894 0 0 0-.002-8.32zm-21.22 1.723c-8.065 0-14.626-6.56-14.626-14.625S30.937 19.5 39.002 19.5s14.625 6.56 14.625 14.625-6.56 14.625-14.625 14.625M65.52 60.64c-.522.524-.92.512-1.43.002l-7.018-7.017 1.428-1.428 7.017 7.017c.393.393.393 1.036.003 1.426"
        }
      ></path>

      <path
        fill={"currentColor"}
        d={
          "m44.477 27.645-6.812 7.789-3.033-3.033a2.437 2.437 0 1 0-3.447 3.447l4.875 4.875a2.44 2.44 0 0 0 1.724.714l.08-.002a2.42 2.42 0 0 0 1.754-.83l8.53-9.75a2.438 2.438 0 0 0-3.67-3.21"
        }
      ></path>
    </svg>
  );
}

export default Fi18896209SvgIcon;
/* prettier-ignore-end */
