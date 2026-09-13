/**
 * Builds a view model without changing the provider's schema or parameter values.
 * Copy and grouping are optional UI policies; unknown controls stay visible.
 */
export function createSettingsAdapter({ toggleCopy = {}, sections = [] } = {}) {
  function adaptSchema(schema) {
    const fields = schema.map((control) => {
      const copy = control.type === "toggle" ? toggleCopy[control.key] : undefined;
      return {
        control,
        presentation: {
          label: copy?.label ?? control.label ?? control.key,
          description: copy?.description ?? control.description ?? "",
        },
        sectionId: sections.find((section) => section.matches(control))?.id,
      };
    });

    return {
      common: fields.filter((field) => field.sectionId === undefined),
      advanced: sections
        .map(({ id, title, description }) => ({
          id,
          title,
          description,
          fields: fields.filter((field) => field.sectionId === id),
        }))
        .filter((section) => section.fields.length),
    };
  }

  function adaptOptions(options) {
    // Display exactly what is sent to the provider, including casing and new values.
    return options.map((option) => ({ ...option, label: String(option.value) }));
  }

  return { adaptSchema, adaptOptions };
}
