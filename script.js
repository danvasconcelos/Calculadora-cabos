let almaSelecionada = 'AF';

const tabelas = {
    'AF': {
        "6.4": [2320, "1/4\""], "8.0": [3610, "5/16\""], "9.5": [5080, "3/8\""],
        "11.5": [7410, "7/16\""], "13.0": [9480, "1/2\""], "14.5": [11700, "9/16\""],
        "16.0": [14300, "5/8\""], "19.0": [20100, "3/4\""], "22.0": [26900, "7/8\""],
        "26.0": [37400, "1\""]
    },
    'AA': {
        "6.4": [2500, "1/4\""], "8.0": [3880, "5/16\""], "9.5": [5460, "3/8\""],
        "11.5": [7960, "7/16\""], "13.0": [10200, "1/2\""], "14.5": [12600, "9/16\""],
        "16.0": [15400, "5/8\""], "19.0": [21600, "3/4\""], "22.0": [28900, "7/8\""],
        "26.0": [40200, "1\""]
    }
};

function setAlma(tipo) {
    almaSelecionada = tipo;
    document.getElementById('btnAF').className = tipo === 'AF'
        ? 'flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md transition-all'
        : 'flex-1 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold transition-all';

    document.getElementById('btnAA').className = tipo === 'AA'
        ? 'flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md transition-all'
        : 'flex-1 py-3 bg-gray-200 text-gray-600 rounded-xl font-bold transition-all';
}

function recomendarCabo() {
    const pesoCarga = parseFloat(document.getElementById('pesoCarga').value);
    const pernas = parseInt(document.getElementById('pernas').value);
    const angulo = parseInt(document.getElementById('angulo').value);
    const enforcado = document.getElementById('enforcado').checked;
    const tipoIcamento = document.getElementById('tipoIcamento').value;
    const fs = 5;

    if (!pesoCarga || pesoCarga <= 0) {
        alert("Informe um peso válido.");
        return;
    }

    const fatorAngulo = Math.cos(angulo * Math.PI / 180);
    const fatorPernas = { 1: 1.0, 2: 1.4, 4: 2.1 };
    const fatorEnforque = enforcado ? 0.8 : 1.0;
    const fatorCesto = tipoIcamento === 'cesto' ? 2.0 : 1.0;

    const dados = tabelas[almaSelecionada];
    let resultado = null;

    for (let d in dados) {
        const mbl = dados[d][0];
        const pol = dados[d][1];
        const wll = (mbl / fs) * fatorAngulo * fatorPernas[pernas] * fatorEnforque * fatorCesto;

        if (wll >= pesoCarga) {
            resultado = { mm: d, pol, wll, tipoIcamento };
            break;
        }
    }

    exibirResultado(resultado);
}

function exibirResultado(res) {
    const card = document.getElementById('resultado-card');
    const topo = document.getElementById('msg-topo');
    const diam = document.getElementById('msg-diametro');
    const det = document.getElementById('msg-detalhe');

    card.classList.remove('hidden');

    if (res) {
        card.className = "mt-4 p-6 rounded-2xl border-2 text-center bg-green-50 border-green-200 text-green-900 shadow-inner";
        topo.innerText = "Cabo Recomendado";
        diam.innerText = `${res.mm} mm (${res.pol})`;
        det.innerText = `Capacidade admissível ≈ ${Math.round(res.wll)} kgf | Tipo: ${res.tipoIcamento === 'cesto' ? 'Cesto (Basket)' : 'Direto'}`;
        document.getElementById('btnPDF').style.display = 'flex';
    } else {
        card.className = "mt-4 p-6 rounded-2xl border-2 text-center bg-red-50 border-red-200 text-red-900 shadow-inner";
        topo.innerText = "Atenção";
        diam.innerText = "Limite Excedido";
        det.innerText = "Nenhum cabo da base atende a carga com os parâmetros informados.";
        document.getElementById('btnPDF').style.display = 'none';
    }
}

async function gerarPDF() {
    const { jsPDF } = window.jspdf;
    const btnPdf = document.getElementById('btnPDF');
    const peso = document.getElementById('pesoCarga').value;
    const pernas = document.getElementById('pernas').value;
    const angulo = document.getElementById('angulo').value;
    const enforcado = document.getElementById('enforcado').checked;
    const tipoIcamento = document.getElementById('tipoIcamento').value;

    btnPdf.style.visibility = 'hidden';

    const card = document.getElementById('resultado-card');

    try {
        const canvas = await html2canvas(card, { scale: 2, backgroundColor: '#f0fdf4' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF();

        const anguloExibicao = angulo == 0 ? 90 : angulo;

        pdf.setFont("helvetica", "bold");
        pdf.text("RELATÓRIO DE DIMENSIONAMENTO", 105, 20, { align: "center" });

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.text(`Data: ${new Date().toLocaleString()}`, 20, 35);

        pdf.line(20, 38, 190, 38);
        pdf.text(`Peso da Carga: ${peso} kgf`, 20, 45);
        pdf.text(`Número de Pernas: ${pernas}`, 20, 50);
        pdf.text(`Ângulo considerado: ${anguloExibicao}°`, 20, 55);
        pdf.text(`Tipo de Alma: ${almaSelecionada === 'AF' ? 'Fibra' : 'Aço'}`, 20, 60);
        pdf.text(`Enforque: ${enforcado ? 'Sim (−20%)' : 'Não'}`, 20, 65);
        pdf.text(`Tipo de Içamento: ${tipoIcamento === 'cesto' ? 'Cesto (Basket)' : 'Direto'}`, 20, 70);
        pdf.line(20, 75, 190, 75);

        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth() - 40;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 20, 85, pdfWidth, pdfHeight);

        pdf.save(`Cabo_${peso}kgf.pdf`);
    } catch (e) {
        alert("Erro ao gerar PDF");
    } finally {
        btnPdf.style.visibility = 'visible';
    }
}
