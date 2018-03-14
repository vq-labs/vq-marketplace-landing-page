const dictionary = {};

const initDictionary = (tenantId, lang) => {
    dictionary[tenantId] = dictionary[tenantId] || {};
    dictionary[tenantId][lang] = dictionary[tenantId][lang] || {};

};

const setLabel = (tenantId, lang, fieldKey, fieldValue) => {
    dictionary[tenantId] = dictionary[tenantId] || {};
    dictionary[tenantId][lang] = dictionary[tenantId][lang] || {};
    dictionary[tenantId][lang][fieldKey] = fieldValue;

};

const getFactory = (tenantId, lang) => {

    try {
        return fieldKey => dictionary[tenantId][lang][fieldKey];
    } catch (err) {
        return fieldKey => fieldKey;
    }
};

module.exports = {
    getFactory,
    initDictionary,
    setLabel
 };