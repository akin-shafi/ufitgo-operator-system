import assert from "node:assert/strict"
import test from "node:test"
import {
  getClassificationError,
  mapApiPackageToFormInitialData,
  mapFormPayloadToApiPayload,
} from "./packageMapper.js"

const hajj = { packageType: "hajj", season: null, seasonYear: "" }
const ramadan = { packageType: "umrah", season: "ramadan", seasonYear: "" }
const general = { packageType: "umrah", season: null, seasonYear: "" }

test("new Hajj and Ramadan require a human-confirmed selling year", () => {
  for (const data of [hajj, ramadan]) {
    assert.match(getClassificationError(data), /Select the selling season year/)
    assert.equal(getClassificationError({ ...data, seasonYear: "2027" }), "")
    assert.equal(mapFormPayloadToApiPayload({ ...data, seasonYear: "2027" }).seasonYear, 2027)
  }
  assert.equal(getClassificationError(general), "")
})

test("legacy unrelated edits omit all classification fields", () => {
  const initial = mapApiPackageToFormInitialData({ type: "hajj", season: null, seasonYear: null })
  assert.equal(getClassificationError(initial, initial), "")
  const payload = mapFormPayloadToApiPayload({ ...initial, name: "Renamed" }, initial)
  for (const key of ["type", "season", "seasonYear"]) assert.equal(Object.hasOwn(payload, key), false)
})

test("AI review requires missing year even on legacy seasonal edits", () => {
  assert.match(getClassificationError(hajj, hajj, true), /Select the selling season year/)
  assert.match(getClassificationError(ramadan, ramadan, true), /Select the selling season year/)
})

test("reclassification requires year; returning to ordinary Umrah clears stale fields", () => {
  assert.match(getClassificationError(hajj, general), /Select the selling season year/)
  assert.match(getClassificationError(ramadan, general), /Select the selling season year/)
  const payload = mapFormPayloadToApiPayload({ ...general, seasonYear: "2027" }, ramadan)
  assert.equal(payload.type, "umrah")
  assert.equal(payload.season, null)
  assert.equal(payload.seasonYear, null)
})

test("Ramadan is only Umrah, year range is inclusive and integer-only", () => {
  assert.match(getClassificationError({ ...hajj, season: "ramadan", seasonYear: 2027 }), /only valid for Umrah/)
  for (const year of [1999, 2201, 2027.5, "unknown"]) {
    assert.match(getClassificationError({ ...hajj, seasonYear: year }), /whole number/)
  }
  for (const year of [2000, 2200]) assert.equal(getClassificationError({ ...hajj, seasonYear: year }), "")
})

test("titles and dates never infer classification; undated packages remain undated", () => {
  const data = mapApiPackageToFormInitialData({ type: "umrah", title: "Ramadan Hajj 2029", departureDate: "2028-03-01" })
  assert.equal(data.season, null)
  assert.equal(data.seasonYear, "")
  const payload = mapFormPayloadToApiPayload({ ...hajj, seasonYear: 2027 })
  assert.equal(payload.departureDate, null)
  assert.equal(payload.returnDate, null)
})
