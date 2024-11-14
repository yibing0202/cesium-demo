/* eslint-disable no-undef */
// 影像地图不带标记
export const gaodeImgBaseMapLayerNoSign = {
  url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
  getFeatureInfoFormats: "gaodeImgBaseMap",
};
// 影像地图标记
export const gaodeImgBaseMapLayerSign = {
  url: "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
  getFeatureInfoFormats: "gaodeImgBaseMapSign",
};

// 高德-矢量地图-数据图层，自带注记
export const gaodeVecBaseMapLayer = {
  url: "http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  getFeatureInfoFormats: "gaodeVecBaseMap",
};

// 矢量图层
export const VecProvider = new Cesium.UrlTemplateImageryProvider(
  gaodeVecBaseMapLayer
);
export const ImgProviderNoSign = new Cesium.UrlTemplateImageryProvider(
  gaodeImgBaseMapLayerNoSign
);
export const ImgProviderSign = new Cesium.UrlTemplateImageryProvider(
  gaodeImgBaseMapLayerSign
);
