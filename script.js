const categories = ["Rent", "Food", "Travel", "Entertainment", "Miscellaneous"];

function generateExpenseInputs() {
    let numMonths = document.getElementById("numMonths").value;
    let container = document.getElementById("expenseInputs");
    container.innerHTML = "";
    document.querySelector("#expenseTable tbody").innerHTML = "";
    document.querySelector("#predictedExpenseTable tbody").innerHTML = "";

    if (numMonths < 2) {
        alert("Please enter at least 2 months of data.");
        return;
    }

    for (let i = 1; i <= numMonths; i++) {
        let section = `<h3>Month ${i} Expenses</h3>`;
        categories.forEach(category => {
            section += `<div class="form-group">
                <label>${category} (₹):</label>
                <input type="number" id="${category.toLowerCase()}_month${i}" required>
            </div>`;
        });
        container.innerHTML += section;
    }

    document.getElementById("predictBtn").style.display = "block";
}

async function analyzeAndPredict() {
    let numMonths = document.getElementById("numMonths").value;
    let income = parseFloat(document.getElementById("income").value);
    let pastExpenses = {};
    categories.forEach(category => { pastExpenses[category] = []; });

    for (let i = 1; i <= numMonths; i++) {
        categories.forEach(category => {
            let expense = parseFloat(document.getElementById(`${category.toLowerCase()}_month${i}`).value);
            if (isNaN(expense)) {
                alert("Please enter valid expense data for all months.");
                return;
            }
            pastExpenses[category].push(expense);
            document.querySelector("#expenseTable tbody").innerHTML += 
                `<tr><td>${category}</td><td>Month ${i}</td><td>₹${expense}</td></tr>`;
        });
    }

    let predictions = {};
    let totalExpenses = 0;

    for (let category of categories) {
        predictions[category] = await trainAndPredict(pastExpenses[category]);
        totalExpenses += parseFloat(predictions[category]);

        document.querySelector("#predictedExpenseTable tbody").innerHTML += 
            `<tr><td>${category}</td><td>₹${predictions[category]}</td></tr>`;
    }

    let savings = income - totalExpenses;
    generateFinancialInsights(savings, income, totalExpenses);
    updateExpenseChart(pastExpenses, predictions);
}

async function trainAndPredict(expenseData) {
    let xs = expenseData.map((_, i) => [i + 1]);
    let ys = expenseData;

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ loss: 'meanSquaredError', optimizer: 'sgd' });

    await model.fit(tf.tensor2d(xs, [xs.length, 1]), tf.tensor2d(ys, [ys.length, 1]), { epochs: 150 });

    let nextMonthPrediction = model.predict(tf.tensor2d([[expenseData.length + 1]], [1, 1]));
    return nextMonthPrediction.dataSync()[0].toFixed(2);
}

function generateFinancialInsights(savings, income, totalExpenses) {
    let alertMessage = totalExpenses > income * 0.8
        ? "⚠ Warning: Your expenses are too high! Consider reducing discretionary spending."
        : savings < income * 0.2
        ? "💡 Tip: Try to save at least 20% of your income for financial stability."
        : "✅ Your spending habits look good! Keep saving and investing wisely.";

    let investmentTips = savings > 0
        ? `💰 You have ₹${savings} available for investments. Consider mutual funds, SIPs, or stocks.`
        : "🚨 No extra savings for investment. Reduce spending and save more.";

    let healthScore = Math.min(100, Math.max(0, ((savings / income) * 100)));
    let budgetChallenges = ["Try a No-Spend Weekend!", "Save ₹500 this week!", "Cook meals at home!"];

    document.getElementById("aiSuggestions").innerHTML = `<h3>AI Suggestions</h3><p>${alertMessage}</p>`;
    document.getElementById("investmentTips").innerHTML = `<h3>Investment Tips</h3><p>${investmentTips}</p>`;
    document.getElementById("financialScore").innerHTML = `<h3>Financial Health Score: ${Math.round(healthScore)}</h3>`;
    document.getElementById("budgetChallenges").innerHTML = `<h3>Budget Challenge</h3><p>${budgetChallenges[Math.floor(Math.random() * budgetChallenges.length)]}</p>`;
}

function updateExpenseChart(pastExpenses, predictions) {
    const ctx = document.getElementById("expenseChart").getContext("2d");

    let labels = Object.values(pastExpenses)[0].map((_, i) => `Month ${i + 1}`);
    labels.push(`Predicted Month ${labels.length + 1}`);

    let datasets = categories.map(category => ({
        label: category,
        data: [...pastExpenses[category], predictions[category]],
        borderColor: getRandomColor(),
        backgroundColor: "rgba(0, 198, 255, 0.2)",
        borderWidth: 2,
        fill: true,
        tension: 0.3
    }));

    new Chart(ctx, {
        type: "line",
        data: { labels, datasets },
        options: { responsive: true }
    });
}

function getRandomColor() {
    return `hsl(${Math.floor(Math.random() * 360)}, 80%, 60%)`;
}
