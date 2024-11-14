/* eslint-disable no-undef */
import * as turf from "@turf/turf";
// cesium 点击事件event.position转经纬度(屏幕坐标转经纬度)
export const getCoordinate = (viewer, position) => {
  let ray = viewer.camera.getPickRay(position);
  let cartesian = viewer.scene.globe.pick(ray, viewer.scene);
  let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
  let lng = Cesium.Math.toDegrees(cartographic.longitude); // 经度
  let lat = Cesium.Math.toDegrees(cartographic.latitude); // 纬度
  let alt = cartographic.height; // 高度
  let coordinate = {
    longitude: Number(lng.toFixed(6)),
    latitude: Number(lat.toFixed(6)),
    altitude: Number(alt.toFixed(2)),
    position: position,
  };

  return coordinate;
};

// 世界坐标转经纬度
export const getCoordinateByCartesian = (viewer, cartesian3) => {
  const ellipsoid = viewer.scene.globe.ellipsoid;
  const cartographic = ellipsoid.cartesianToCartographic(cartesian3);
  const lat = Cesium.Math.toDegrees(cartographic.latitude);
  const lng = Cesium.Math.toDegrees(cartographic.longitude);
  const alt = cartographic.height;
  let coordinate = {
    longitude: Number(lng.toFixed(6)),
    latitude: Number(lat.toFixed(6)),
    altitude: Number(alt.toFixed(2)),
    position: cartesian3,
  };
  return coordinate;
};

// 计算地图两点之间的距离
export const getTwoPointsDistance = (startPoint, endPoint) => {
  if (!startPoint || !endPoint || startPoint.length < 1 || endPoint.length < 1)
    return null;
  var from = turf.point(startPoint);
  var to = turf.point(endPoint);
  var options = { units: "kilometers" };
  var distance = turf.distance(from, to, options) * 1000;
  return distance;
};

// 获取多边形或者线段中心点
export const getShapeCenter = (shapePosition) => {
  const list = [];
  const pointList = shapePosition.concat();
  for (var i = 0; i < pointList.length; i++) {
    list.push(turf.point(pointList[i]));
  }
  const features = turf.featureCollection(list);
  const center = turf.center(features);
  return center;
};

// shapePosition:[[经度，维度],[经度，维度]] 按照每个点转世界坐标形成数组
export const getCesiumPositions = (shapePosition) => {
  if (!shapePosition || shapePosition.length < 1) return [];
  const position = [];
  for (var i = 0; i < shapePosition.length; i++) {
    position.push(
      Cesium.Cartesian3.fromDegrees(shapePosition[i][0], shapePosition[i][1])
    );
  }
  return position;
};

// 根据参考点偏移点计算参考点的偏移信息
export const getMoveInfoByRefer = (referPosition, position) => {
  // 指定参考点则按照参考点移动,不指定则按照设备中心点移动位置
  const center = referPosition;

  // 计算两个点之间的角度
  const point1 = turf.point(
    center.geometry ? center.geometry.coordinates : center
  );
  const point2 = turf.point(
    position.geometry ? position.geometry.coordinates : position
  );
  const bearing = turf.bearing(point1, point2);

  // 计算两点之间的距离
  const options = { units: "miles" };
  const distance = turf.distance(point1, point2, options);

  return {
    distance: distance,
    bearing: bearing,
    options: options,
  };
};

// 根据一个点和点的偏移信息计算偏移后的点
export const getMovePoint = (point, info) => {
  if (!point || point.length < 1) return [];
  const { distance, bearing, options } = info;
  const turfPoint = turf.point(point);
  const destination = turf.destination(turfPoint, distance, bearing, options);
  return destination.geometry.coordinates;
};

// 经纬度转屏幕坐标
export const getPositionByGeographic = (viewer, params) => {
  // 经纬度转屏幕坐标
  const pick = Cesium.Cartesian3.fromDegrees(params[0], params[1], 0);
  const position = new Cesium.SceneTransforms.wgs84ToWindowCoordinates(
    viewer.scene,
    pick
  );
  position.longitude = params[0];
  position.latitude = params[1];

  return position;
};

// 根据宽高和中心点。计算矩形多边形四个顶点的坐标信息
export const getPolygonShapePositionByCenterPoint = (
  centerPosition,
  width,
  height,
  viewer
) => {
  const w1 = centerPosition.x - width / 2;
  const w2 = centerPosition.x + width / 2;
  const h1 = centerPosition.y - height / 2;
  const h2 = centerPosition.y + height / 2;

  const pointList1 = getCoordinate(viewer, {
    x: w1,
    y: h1,
  });
  const pointList2 = getCoordinate(viewer, {
    x: w2,
    y: h1,
  });
  const pointList3 = getCoordinate(viewer, {
    x: w2,
    y: h2,
  });
  const pointList4 = getCoordinate(viewer, {
    x: w1,
    y: h2,
  });
  return [pointList1, pointList2, pointList3, pointList4];
};

// 根据宽高和中心点。计算线段2个顶点的坐标信息
export const getLineShapePositionByCenterPoint = (
  centerPosition,
  width,
  viewer
) => {
  const w1 = centerPosition.x - width / 2;
  const w2 = centerPosition.x + width / 2;

  const pointList1 = getCoordinate(viewer, {
    x: w1,
    y: centerPosition.y,
  });
  const pointList2 = getCoordinate(viewer, {
    x: w2,
    y: centerPosition.y,
  });

  return [pointList1, pointList2];
};
