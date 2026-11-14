#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <random>
#include <sstream>
#include <stdexcept>
#include "stim/circuit/circuit.h"
#include "stim/diagram/timeline/timeline_svg_drawer.h"
#include "stim/simulators/tableau_simulator.h"

using emscripten::val;
using namespace stim;
using namespace stim_draw_internal;

static Circuit checked_circuit(const std::string &text) {
    if (text.size() > 100000) throw std::invalid_argument("Circuit text exceeds 100 KB.");
    Circuit circuit{std::string_view(text)};
    if (circuit.count_qubits() > 64) throw std::invalid_argument("Use qubit indices 0 through 63 in this playground.");
    if (circuit.count_measurements() > 512) throw std::invalid_argument("Use at most 512 measurement results per shot.");
    if (circuit.count_sweep_bits()) throw std::invalid_argument("Sweep-bit inputs are not supplied by this playground.");
    size_t operations = 0, targets = 0;
    circuit.for_each_operation([&](const CircuitInstruction &op) {
        operations++;
        targets += op.targets.size();
        if (operations > 4000 || targets > 32000) throw std::invalid_argument("Expanded circuit exceeds the browser limit (4000 instructions / 32000 targets).");
    });
    return circuit;
}
static val failure(const std::exception &error) {
    val out=val::object(); out.set("error",std::string(error.what())); return out;
}
static val inspect_circuit(const std::string &text) {
    try {
        auto circuit=checked_circuit(text);
        std::ostringstream svg;
        std::vector<CoordFilter> filters{CoordFilter{}};
        DiagramTimelineSvgDrawer::make_diagram_write_to(circuit,svg,0,UINT64_MAX,DiagramTimelineSvgDrawerMode::SVG_MODE_TIMELINE,SpanRef<const CoordFilter>(filters),0);
        auto drawing=svg.str();
        if (drawing.size()>4000000) throw std::invalid_argument("Circuit diagram is too large; simplify the circuit.");
        val out=val::object();
        out.set("text",circuit.str());out.set("svg",drawing);
        out.set("qubits",static_cast<unsigned>(circuit.count_qubits()));
        out.set("measurements",static_cast<unsigned>(circuit.count_measurements()));
        out.set("detectors",static_cast<unsigned>(circuit.count_detectors()));
        out.set("observables",static_cast<unsigned>(circuit.count_observables()));
        return out;
    } catch (const std::exception &error) {return failure(error);}
}
static val sample_circuit(const std::string &text,unsigned shots,unsigned seed) {
    try {
        if(shots<1||shots>2000) throw std::invalid_argument("Choose 1 to 2000 shots.");
        auto circuit=checked_circuit(text);
        auto count=circuit.count_measurements();std::mt19937_64 rng(seed);
        val out=val::object(),rows=val::array();
        for(unsigned shot=0;shot<shots;shot++) {
            auto bits=TableauSimulator<64>::sample_circuit(circuit,rng);
            std::string row;row.reserve(count);
            for(size_t k=0;k<count;k++)row+=bits[k]?'1':'0';
            rows.set(shot,row);
        }
        out.set("rows",rows);out.set("shots",shots);out.set("measurements",static_cast<unsigned>(count));out.set("seed",seed);
        return out;
    } catch (const std::exception &error) {return failure(error);}
}
EMSCRIPTEN_BINDINGS(surface_lab_stim) {
    emscripten::function("inspectCircuit",&inspect_circuit);
    emscripten::function("sampleCircuit",&sample_circuit);
}
