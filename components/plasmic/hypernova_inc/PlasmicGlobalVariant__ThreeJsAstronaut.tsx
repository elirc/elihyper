/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/* prettier-ignore-start */

import * as React from "react";
import { createUseScreenVariants } from "@plasmicapp/react-web";

export type ThreeJsAstronautValue = "override";
export const ThreeJsAstronautContext = React.createContext<
  ThreeJsAstronautValue | undefined
>("PLEASE_RENDER_INSIDE_PROVIDER" as any);
export function ThreeJsAstronautContextProvider(
  props: React.PropsWithChildren<{ value: ThreeJsAstronautValue | undefined }>
) {
  return (
    <ThreeJsAstronautContext.Provider value={props.value}>
      {props.children}
    </ThreeJsAstronautContext.Provider>
  );
}

export function useThreeJsAstronaut() {
  return React.useContext(ThreeJsAstronautContext);
}

export default ThreeJsAstronautContext;
/* prettier-ignore-end */
