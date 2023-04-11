//https://dashboard.sheety.co/projects/6403c71894b3b60680e21937/sheets/cast

// global vars (a sin, I know)
var CastJsonList = [];
var CharacterNames = [];
var TodayPerformerNames = [];
var PerformerNames = [];
var UnselectedPerformerNames = [];
var DuplicateCharacters = [];

var bTesting = false; // change this to true to fetch the smaller dummy cast for easier testing

//var CastApiUrl = "https://api.sheety.co/acf668d6acaab4b70f6945ec76cce551/tbcastdle/cast";
//var Cast2ApiUrl = "https://api.sheety.co/acf668d6acaab4b70f6945ec76cce551/tbcastdle/cast2";
//var TestApiUrl = "https://api.sheety.co/acf668d6acaab4b70f6945ec76cce551/tbcastdle/test";
//var Test2ApiUrl = "https://api.sheety.co/acf668d6acaab4b70f6945ec76cce551/tbcastdle/test2";

var CastApiUrl = "https://script.google.com/macros/s/AKfycbyMg1vMtOAzqDS5_6qiWzydCFX300s4MX8OTwGY1tANWIQFmKg3iaxswvt-6fwgiyoeWA/exec?path=cast";
var Cast2ApiUrl = "https://script.google.com/macros/s/AKfycbyMg1vMtOAzqDS5_6qiWzydCFX300s4MX8OTwGY1tANWIQFmKg3iaxswvt-6fwgiyoeWA/exec?path=cast2";
var TestApiUrl = "https://script.google.com/macros/s/AKfycbyMg1vMtOAzqDS5_6qiWzydCFX300s4MX8OTwGY1tANWIQFmKg3iaxswvt-6fwgiyoeWA/exec?path=test";
var Test2ApiUrl = "https://script.google.com/macros/s/AKfycbyMg1vMtOAzqDS5_6qiWzydCFX300s4MX8OTwGY1tANWIQFmKg3iaxswvt-6fwgiyoeWA/exec?path=test2";

var SubmitUrl = "https://script.google.com/macros/s/AKfycbyMg1vMtOAzqDS5_6qiWzydCFX300s4MX8OTwGY1tANWIQFmKg3iaxswvt-6fwgiyoeWA/exec";


var NumGuesses = 0;
var GuessColors = [];

var HeartMap = {
    'green': "&#128154;",
    'orange': "&#128155;",
    'gray': "&#128420;"
};

$(document).ready(function () {
    $.getJSON(bTesting ? TestApiUrl : CastApiUrl, function (data) {
        //CastJsonList = data[bTesting ? 'test' : 'cast']; // sheety
        CastJsonList = data;
        CastJsonList.forEach(function (row) {
            if (row.character) {
                row.character = row.character.replaceAll('*', '');
            }
        });

        Initiate();
        $("#loading").html("");
    });
});


function ResetGlobalVars() {
    CastJsonList = [];
    CharacterNames = [];
    TodayPerformerNames = [];
    PerformerNames = [];
    UnselectedPerformerNames = [];
    NumGuesses = 0;
    GuessColors = [];
    DuplicateCharacters = [];
}

function GetAlternateCast() {
    $.getJSON(bTesting ? Test2ApiUrl : Cast2ApiUrl, function (data) {
        // if (data[bTesting ? 'test2' : 'cast2'][0]['character'].indexOf("N/A") > -1) { // sheety
        if (data[0]['character'].indexOf("N/A") > -1) {
            // not a valid alternate cast
            window.alert("There is no second cast to show yet!");
            return;
        }

        ResetGlobalVars();
        $('#submit').prop('disabled', true);
        $('#results').html('');

        // CastJsonList = data[bTesting ? 'test2' : 'cast2']; // sheety
        CastJsonList = data;
        CastJsonList.forEach(function (row) {
            if (row.character) {
                row.character = row.character.replaceAll('*', '');
            }
        });

        CastJsonList[0]['date'] = CastJsonList[0]['date'].replaceAll('matinee', '').replaceAll('Matinee', '');
        CastJsonList[0]['date'] += "Evening";

        Initiate();
        $("#loading").html("");
    });
}

function Initiate() {

    // get the date, being looked after by aegisthus 
    var date = CastJsonList[0]['date'];
    $("#date").html(date);

    if (date.toLowerCase().indexOf("matinee") > -1) {
        $('#swap').css('display', 'inline');
    }

    // collect names of all characters and performers in today's cast list
    CastJsonList.forEach(function (row) {
        if (row.character) {
            var charName = row['character'];
            if (CharacterNames.indexOf(charName) > -1) {
                DuplicateCharacters.push(charName);
                charName += ' 2';
                row['character'] = charName;
            }
            CharacterNames.push(charName);
            TodayPerformerNames.push(row['performer']);
        }
    });

    // temp - add wildcards here if we want them
    PerformerNames = [...TodayPerformerNames];
    PerformerNames.sort();

    // build the table!
    {
        var output = [];
        CharacterNames.forEach(function (name) {
            output.push('<tr><td class="charname">' + name + '</td><td><select id=' + name.replaceAll(' ', '') + '></select></td></tr>')
        });
        $('#selects').html(output.join(''));
    }

    PopulateSelects(PerformerNames);
    BindSelectEvents();
    UpdateUnselectedNames([]);
}

function PopulateSelects(namesList) {
    var output = ['<option value="-">-</option>'];
    namesList.forEach(function (name) {
        output.push('<option value="' + name + '">' + name + '</option>');
    });

    $('select').each(function index() {
        if (!$(this).prop("disabled")) {
            $(this).html(output.join(''));
        }
    });
    //$('select').html(output.join(''));
}

function OnDropDownChange(e) {
    var seenNames = [];
    var bHasDuplicate = false;

    // highlight duplicates
    {
        var duplicatedNames = [];
        $('select').css('color', 'black');
        $('select').each(function (index) {
            if (this.value === '-') {
                return; // acts like continue...
            }

            if (seenNames.indexOf(this.value) > -1) {
                duplicatedNames.push(this.value);
                bHasDuplicate = true;
            }

            seenNames.push(this.value);
        });

        $('select').each(function (index) {
            if (duplicatedNames.indexOf(this.value) > -1) {
                $(this).css('color', 'red');
            }
        });
    }

    // can we enable the submit button?
    var bEnabled = !bHasDuplicate && (seenNames.length === TodayPerformerNames.length);
    $('#submit').prop('disabled', !bEnabled);

    UpdateUnselectedNames(seenNames);
}

function BindSelectEvents() { // must be called after <selects> are created
    $('select').change(function (e) {
        OnDropDownChange();
    });
}

function UpdateUnselectedNames(seenNames) {
    // show unselected names for ease
    UnselectedPerformerNames = [...PerformerNames]; // copy by value
    seenNames.forEach(function (seen) {
        var nameIdx = UnselectedPerformerNames.indexOf(seen);
        if (nameIdx > -1) {
            UnselectedPerformerNames.splice(nameIdx, 1);
        }
    })
    $('#unselected').html(UnselectedPerformerNames.join(', '));
}

$('#submit').click(function () {
    NumGuesses += 1;

    // time to check if we're right!
    var bAllCorrect = CheckSelections();

    if (!bAllCorrect) {
        DisplaySelections(); // add column of guesses
        OnDropDownChange();
        PopulateSelects(UnselectedPerformerNames);
    } else {
        if (NumGuesses === 1) {
            $('#results').html("You got it in 1 guess! &#x1f3c6;<br>" + MakeHearts());
        } else {
            $('#results').html("You got it in " + NumGuesses + " guesses!<br>" + MakeHearts());
        }
        $('#submit').attr("disabled", true);

        $.get(SubmitUrl, function (data, status) {});
    }
});

function CheckSelections() {
    var bAllCorrect = true;
    var colors = [];
    CastJsonList.forEach(function (row) {
        if (row.character) {
            var selectElement = $('#' + row.character.replaceAll(' ', ''));
            var selectedName = selectElement[0].value;
            if (selectedName === row.performer) { // correct!
                selectElement.css('color', 'green');
                selectElement.attr('disabled', 'true');
                colors.push('green');
            } else if (TodayPerformerNames.indexOf(selectedName) > -1) { // wrong place
                var bDuplicateCorrect = false;

                // was it a NYX/Peep ordering issue?
                if (DuplicateCharacters.indexOf(row.character.replaceAll(' 2', '')) > -1) {
                    if (LookupCharacterInCast(GetDuplicateCharacterAlternate(row.character)) === selectedName) {
                        selectElement.css('color', 'green');
                        selectElement.attr('disabled', 'true');
                        colors.push('green');
                        bDuplicateCorrect = true;
                    }
                }

                if (!bDuplicateCorrect) {
                    selectElement.css('color', 'orange');
                    bAllCorrect = false;
                    colors.push('orange');
                }
            } else {
                selectElement.css('color', 'gray');
                bAllCorrect = false;
                colors.push('gray');
            }
        }
    });

    GuessColors.push(colors);

    return bAllCorrect;
}

function GetDuplicateCharacterAlternate(character) {
    if (character.indexOf("2") > -1) {
        return character.replaceAll(' 2', '');
    } else {
        return character + " 2";
    }
}

function LookupCharacterInCast(character) {
    for (i = 0; i < CastJsonList.length; i++) {
        if (CastJsonList[i].character == character) {
            return CastJsonList[i].performer;
        }
    }
}


function DisplaySelections() {
    var newColumnArray = [];
    $('select').each(function (index) {
        var color = $(this).css('color');
        newColumnArray.push('<td style="color:' + color + '">' + this.value + '</td>');
        if (!$(this).prop("disabled")) {
            $(this).val("-");
        }
    });

    $('table').find('tr').each(function (i) {
        $(this).find('td').eq(1).after(newColumnArray[i]); //'<td>' + newColumnArray[i] + '</td>');
    });
}

function MakeHearts() {
    var output = "";
    GuessColors.forEach(function (colors) {
        colors.forEach(function (color, index) {
            this[index] = HeartMap[color];
        }, colors);
        output += "<br>" + colors.join("");
    });
    return output;
}

// help modal
$('#help').click(function () {
    $("#helpmodal").css("display", "block");
});

$('.close').click(function () {
    $("#helpmodal").css("display", "none");
});

window.onclick = function (event) {
    if (event.target == document.getElementById("helpmodal")) {
        $("#helpmodal").css("display", "none");
    }
}

// swap cast
$('#swap').click(function () {
    GetAlternateCast();
    $('#swap').css('display', 'none');
})
