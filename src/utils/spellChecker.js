import Typo from 'typo-js';
//import spanishDict from 'typo-js-dictionaries/es_ES';

const dictionary = new Typo('en_US');

export function checkSpelling(text) {
    let is_spelled_correctly = dictionary.check(text);
    let array_of_suggestions = dictionary.suggest(text);
    console.log(array_of_suggestions);
    console.log(is_spelled_correctly);
    return true;
}
