/* eslint-disable no-undef */
import { ShapeConfig } from "./df-cesium/config/shapeconfig";
import * as utilsTools from "./df-cesium/utils/utils";

const createLinkDom = (cssUrl, jsUrl) => {
  const promise = new Promise((resolve, reject) => {
    try {
      const linkDom = document.createElement("link");
      linkDom.rel = "stylesheet";
      linkDom.href ="./Cesium/Widgets/widgets.css";

      document.head.appendChild(linkDom);

      const script = document.createElement("script");
      script.src ="./Cesium/Cesium.js";

      script.onload = () => {
        console.log("onload");
        resolve();
      };
      document.head.appendChild(script);
    } catch (error) {
      reject(error);
    }
  });

  return promise;
};

// 创建dfCesiumApplication
export const createDfCesiumApplication = async (params, cssUrl, jsUrl) => {
  
  await createLinkDom(cssUrl, jsUrl);
  // eslint-disable-next-line no-undef
  const { DfcesiumApplication } = require("./df-cesium");
  return new DfcesiumApplication(params);
};

export const ShapeBaseConfig = ShapeConfig;

export const utils = utilsTools;
