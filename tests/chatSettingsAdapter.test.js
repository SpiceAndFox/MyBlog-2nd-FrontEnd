import assert from "node:assert/strict";
import { test } from "node:test";
import { createSettingsAdapter } from "../src/components/Chat/utils/settingsAdapter.js";
import { chatSettingsAdapter } from "../src/components/Chat/utils/settingsPresentation.js";

test("technical and unknown fields retain provider labels, constraints and metadata", () => {
  const schema = Object.freeze([
    Object.freeze({ key: "temperature", label: "Temperature", type: "range", min: 0, max: 2, step: 0.1 }),
    Object.freeze({ key: "reasoningEffort", label: "Reasoning Effort", type: "select", optionsFrom: "reasoningEfforts" }),
    Object.freeze({ key: "futureBudget", type: "number", min: 1, max: 999 }),
  ]);
  const view = chatSettingsAdapter.adaptSchema(schema);

  assert.deepEqual(view.common.map((field) => field.presentation.label), [
    "Temperature", "Reasoning Effort", "futureBudget",
  ]);
  view.common.forEach((field, index) => assert.equal(field.control, schema[index]));
  assert.deepEqual(view.advanced, []);
});

test("enum labels display original values, including future values and exact casing", () => {
  const values = ["medium", "MEDIUM", "xhigh", "max", "future-effort", "BLOCK_ONLY_HIGH", 0];
  const options = Object.freeze(values.map((value) => Object.freeze({ value, label: "Provider label" })));
  const adapted = chatSettingsAdapter.adaptOptions(options);

  assert.deepEqual(adapted.map((option) => option.label), values.map(String));
  assert.deepEqual(adapted.map((option) => option.value), values);
  assert.ok(options.every((option) => option.label === "Provider label"));
});

test("adapting model-filtered options never introduces extra enum values", () => {
  const filteredOptions = [{ value: "high", label: "High" }, { value: "max", label: "Max" }];
  assert.deepEqual(chatSettingsAdapter.adaptOptions(filteredOptions), [
    { value: "high", label: "high" }, { value: "max", label: "max" },
  ]);
  assert.deepEqual(chatSettingsAdapter.adaptOptions([]), []);
});

test("friendly copy applies only to configured toggles and never replaces source metadata", () => {
  const stream = Object.freeze({ key: "stream", label: "Streaming", type: "toggle", default: true });
  const fields = chatSettingsAdapter.adaptSchema([
    stream,
    { key: "stream", label: "Stream Mode", type: "select" },
    { key: "futureToggle", label: "Future Toggle", type: "toggle" },
  ]).common;

  assert.equal(fields[0].presentation.label, "逐字显示");
  assert.equal(fields[0].control, stream);
  assert.equal(fields[0].control.label, "Streaming");
  assert.equal(fields[1].presentation.label, "Stream Mode");
  assert.equal(fields[2].presentation.label, "Future Toggle");
});

test("grouping includes each field exactly once and preserves order within sections", () => {
  const schema = ["safetyNewCategory", "temperature", "webSearchRecency", "topP", "customParameter", "frequencyPenalty"]
    .map((key) => ({ key, label: key, type: "number" }));
  const { common, advanced } = chatSettingsAdapter.adaptSchema(schema);

  assert.deepEqual(common.map((field) => field.control.key), ["temperature", "customParameter"]);
  assert.deepEqual(advanced.map((section) => section.id), ["sampling", "search", "safety"]);
  assert.deepEqual(advanced[0].fields.map((field) => field.control.key), ["topP", "frequencyPenalty"]);
  const controls = [...common, ...advanced.flatMap((section) => section.fields)].map((field) => field.control);
  assert.equal(controls.length, schema.length);
  assert.equal(new Set(controls).size, schema.length);
  assert.deepEqual(chatSettingsAdapter.adaptSchema([]), { common: [], advanced: [] });
});

test("UI policy can be supplied independently, with the first matching section taking precedence", () => {
  const adapter = createSettingsAdapter({
    toggleCopy: { customToggle: { label: "Custom UI copy" } },
    sections: [
      { id: "custom", title: "Custom", matches: (control) => control.key === "customToggle" },
      { id: "all", title: "All", matches: () => true },
    ],
  });
  const control = { key: "customToggle", label: "Raw label", type: "toggle" };
  const view = adapter.adaptSchema([control]);

  assert.equal(view.advanced.length, 1);
  assert.equal(view.advanced[0].id, "custom");
  assert.equal(view.advanced[0].fields[0].presentation.label, "Custom UI copy");
  assert.equal(createSettingsAdapter().adaptSchema([control]).common[0].presentation.label, "Raw label");
});
