//https://dashboard.sheety.co/projects/6403c71894b3b60680e21937/sheets/cast

// global vars (a sin, I know)
var CastJsonList = [];
var CharacterNames = [];
var TodayPerformerNames = [];
var PerformerNames = [];
var UnselectedPerformerNames = [];

var bTesting = false; // change this to true to fetch the smaller dummy cast for easier testing

var CastApiUrl = "https://api.sheety.co/acf668d6acaab4b70f6945ec76cce551/tbcastdle/cast";
var TestApiUrl = "https://api.sheety.co/acf668d6acaab4b70f6945ec76cce551/tbcastdle/test";

var NumGuesses = 0;
var GuessColors = [];

var HeartMap = {
    'green': "&#128154;",
    'orange': "&#128155;",
    'gray': "&#128420;"
};

$(document).ready(function () {
    $.getJSON(bTesting ? TestApiUrl : CastApiUrl, function (data) {
        CastJsonList = data[bTesting ? 'test' : 'cast'];
        CastJsonList.forEach(function (row) {
            row.character = row.character.replaceAll('*', '');
        });

        Initiate();
        $("#loading").html("");
    });
});

function Initiate() {

    // get the date, being looked after by aegisthus 
    var date = CastJsonList[0]['date'];
    $("#date").html(date);

    // collect names of all characters and performers in today's cast list
    CastJsonList.forEach(function (row) {
        var charName = row['character'];
        if (CharacterNames.indexOf(charName) > -1) {
            charName += ' 2';
            row['character'] = charName;
        }
        CharacterNames.push(charName);
        TodayPerformerNames.push(row['performer']);
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
    }
});

function CheckSelections() {
    var bAllCorrect = true;
    var colors = [];
    CastJsonList.forEach(function (row) {
        var selectElement = $('#' + row.character.replaceAll(' ', ''));
        var selectedName = selectElement[0].value;
        if (selectedName === row.performer) { // correct!
            selectElement.css('color', 'green');
            selectElement.attr('disabled', 'true');
            colors.push('green');
        } else if (TodayPerformerNames.indexOf(selectedName) > -1) { // wrong place
            selectElement.css('color', 'orange');
            bAllCorrect = false;
            colors.push('orange');
        } else {
            selectElement.css('color', 'gray');
            bAllCorrect = false;
            colors.push('gray');
        }
    });

    GuessColors.push(colors);

    return bAllCorrect;
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
