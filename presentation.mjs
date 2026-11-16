/** Keep default biology separate from facts known for the selected form. */
export function detailView(pokemon, formId, typeNames = {}) {
  const forms = pokemon.forms || [];
  const form = forms.find(f => String(f.id) === String(formId)) || forms[0] || pokemon;
  const variant = forms.length > 0 && form !== forms[0];
  const typeText = (form.types || []).map(t => typeNames[t] || t).join('、');
  return {
    form, variant,
    description: variant ? `它有${typeText}属性，这是${form.label}。` : pokemon.description,
    baseDescription: variant ? pokemon.description : '',
    classificationLabel: variant ? '形态' : '分类',
    classificationValue: variant ? form.label : pokemon.genus,
    showDefaultEvolutionConditions: !variant,
  };
}
