import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\auth\\login.js"
import { onRequestPost as __api_auth_signup_js_onRequestPost } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\auth\\signup.js"
import { onRequestGet as __api_auth_validate_js_onRequestGet } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\auth\\validate.js"
import { onRequestPost as __api_auth_validate_js_onRequestPost } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\auth\\validate.js"
import { onRequest as __api_crops_irrigation_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops\\irrigation.js"
import { onRequest as __api_crops_pests_diseases_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops\\pests-diseases.js"
import { onRequest as __api_crops_rotation_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops\\rotation.js"
import { onRequest as __api_crops_soil_health_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops\\soil-health.js"
import { onRequest as __api_finance_entries_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\finance\\entries.js"
import { onRequestPost as __api_crops_js_onRequestPost } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops.js"
import { onRequest as __api_analytics_engine_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\analytics-engine.js"
import { onRequest as __api_animals_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\animals.js"
import { onRequest as __api_animals_enhanced_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\animals-enhanced.js"
import { onRequest as __api_crops_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops.js"
import { onRequest as __api_crops_main_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\crops-main.js"
import { onRequest as __api_debug_db_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\debug-db.js"
import { onRequest as __api_farms_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\farms.js"
import { onRequest as __api_farms_enhanced_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\farms-enhanced.js"
import { onRequest as __api_fields_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\fields.js"
import { onRequest as __api_fields_enhanced_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\fields-enhanced.js"
import { onRequest as __api_finance_enhanced_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\finance-enhanced.js"
import { onRequest as __api_inventory_index_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\inventory\\index.js"
import { onRequest as __api_inventory_enhanced_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\inventory-enhanced.js"
import { onRequest as __api_migrate_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\migrate.js"
import { onRequest as __api_seed_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\seed.js"
import { onRequest as __api_system_integration_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\system-integration.js"
import { onRequest as __api_tasks_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\tasks.js"
import { onRequest as __api_tasks_enhanced_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\tasks-enhanced.js"
import { onRequest as __api_weather_location_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\api\\weather-location.js"
import { onRequest as __health_js_onRequest } from "C:\\Users\\MunyaradziGangayi\\Documents\\Coder\\Retry\\functions\\health.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/signup",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_signup_js_onRequestPost],
    },
  {
      routePath: "/api/auth/validate",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_validate_js_onRequestGet],
    },
  {
      routePath: "/api/auth/validate",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_validate_js_onRequestPost],
    },
  {
      routePath: "/api/crops/irrigation",
      mountPath: "/api/crops",
      method: "",
      middlewares: [],
      modules: [__api_crops_irrigation_js_onRequest],
    },
  {
      routePath: "/api/crops/pests-diseases",
      mountPath: "/api/crops",
      method: "",
      middlewares: [],
      modules: [__api_crops_pests_diseases_js_onRequest],
    },
  {
      routePath: "/api/crops/rotation",
      mountPath: "/api/crops",
      method: "",
      middlewares: [],
      modules: [__api_crops_rotation_js_onRequest],
    },
  {
      routePath: "/api/crops/soil-health",
      mountPath: "/api/crops",
      method: "",
      middlewares: [],
      modules: [__api_crops_soil_health_js_onRequest],
    },
  {
      routePath: "/api/finance/entries",
      mountPath: "/api/finance",
      method: "",
      middlewares: [],
      modules: [__api_finance_entries_js_onRequest],
    },
  {
      routePath: "/api/crops",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_crops_js_onRequestPost],
    },
  {
      routePath: "/api/analytics-engine",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_analytics_engine_js_onRequest],
    },
  {
      routePath: "/api/animals",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_animals_js_onRequest],
    },
  {
      routePath: "/api/animals-enhanced",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_animals_enhanced_js_onRequest],
    },
  {
      routePath: "/api/crops",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_crops_js_onRequest],
    },
  {
      routePath: "/api/crops-main",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_crops_main_js_onRequest],
    },
  {
      routePath: "/api/debug-db",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_debug_db_js_onRequest],
    },
  {
      routePath: "/api/farms",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_farms_js_onRequest],
    },
  {
      routePath: "/api/farms-enhanced",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_farms_enhanced_js_onRequest],
    },
  {
      routePath: "/api/fields",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_fields_js_onRequest],
    },
  {
      routePath: "/api/fields-enhanced",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_fields_enhanced_js_onRequest],
    },
  {
      routePath: "/api/finance-enhanced",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_finance_enhanced_js_onRequest],
    },
  {
      routePath: "/api/inventory",
      mountPath: "/api/inventory",
      method: "",
      middlewares: [],
      modules: [__api_inventory_index_js_onRequest],
    },
  {
      routePath: "/api/inventory-enhanced",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_inventory_enhanced_js_onRequest],
    },
  {
      routePath: "/api/migrate",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_migrate_js_onRequest],
    },
  {
      routePath: "/api/seed",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_seed_js_onRequest],
    },
  {
      routePath: "/api/system-integration",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_system_integration_js_onRequest],
    },
  {
      routePath: "/api/tasks",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_tasks_js_onRequest],
    },
  {
      routePath: "/api/tasks-enhanced",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_tasks_enhanced_js_onRequest],
    },
  {
      routePath: "/api/weather-location",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_weather_location_js_onRequest],
    },
  {
      routePath: "/health",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__health_js_onRequest],
    },
  ]