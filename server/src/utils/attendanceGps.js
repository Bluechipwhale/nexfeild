import {validateCoordinates} from './haversine.js';
export const workplaceRadius=location=>String(location?.location_type).toLowerCase()==='market'?300:Number(location?.geofence_radius||location?.geofence_radius_meters||150);
export function attendanceAccuracy(value){
 if(value==null||!['number','string'].includes(typeof value)||String(value).trim()===''||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>500){const reported=['number','string'].includes(typeof value)&&Number.isFinite(Number(value))&&String(value).trim()!==''?`±${Math.round(Number(value))}m`:'missing or invalid';throw new Error(`LOCATION ACCURACY TOO LOW — Your device reports ${reported}. A valid device GPS accuracy between 0 and 500 metres is required. Enable precise location and try again.`);}
 return Number(value);
}
export function validateAttendanceGPS(data,now=Date.now()){
 const point=validateCoordinates(data.latitude,data.longitude);if(!point.valid)throw new Error(point.message);
 const accuracy=attendanceAccuracy(data.accuracy);
 if(data.timestamp!==undefined&&(typeof data.timestamp!=='number'||!Number.isFinite(data.timestamp)||Math.abs(now-data.timestamp)>60000))throw new Error('The GPS fix is stale or invalid. Get a fresh location and try again.');
 return {...data,latitude:point.latitude,longitude:point.longitude,accuracy};
}
