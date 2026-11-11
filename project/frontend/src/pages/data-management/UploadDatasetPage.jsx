import Icon from "../../components/Icon";
import { PageHeader, Panel, StatusBadge } from "../../components/ui";
import { ApiCapabilityNotice } from "./shared";

export default function UploadDatasetPage() {
  return <div className="secondary-page upload-dataset-page">
    <PageHeader eyebrow="DATA MANAGEMENT / INTAKE" title="Upload a dataset" subtitle="Bring a business dataset into the SDADIS analysis workflow." actions={<StatusBadge tone="preview" dot>Frontend preview</StatusBadge>} />
    <ApiCapabilityNotice icon="upload" title="File intake is not connected to the React application.">
      FastAPI has no upload route, so this page does not accept files, validate a selection, or report transfer progress. The area below is a visual preview only.
    </ApiCapabilityNotice>

    <section className="upload-workspace-grid">
      <Panel title="Add a source file" subtitle="Drag-and-drop workspace preview" className="upload-workspace-panel" action={<StatusBadge tone="preview">Preview only</StatusBadge>}>
        <div className="upload-dropzone-preview" aria-label="Upload workspace preview, not interactive">
          <span className="upload-cloud-icon"><Icon name="upload" /></span>
          <strong>Drag a dataset file into this area</strong>
          <p>File selection and upload are intentionally inactive until a FastAPI upload endpoint is available.</p>
          <div className="upload-format-chips"><span>CSV</span><span>XLSX</span><span>XLS</span></div>
          <small>These formats are handled by the separate Streamlit AIML uploader; this React preview does not upload them.</small>
        </div>
      </Panel>

      <aside className="upload-guidance-column">
        <Panel title="Intake flow" subtitle="The intended handoff from file to analysis">
          <ol className="upload-steps"><li><span>01</span><div><strong>Select a source</strong><small>Upload route required</small></div></li><li><span>02</span><div><strong>Review file structure</strong><small>Preview and schema response required</small></div></li><li><span>03</span><div><strong>Start analysis</strong><small>Analysis job route required</small></div></li></ol>
        </Panel>
        <div className="upload-requirement-note"><span className="requirement-mark">i</span><p><strong>Integration requirement</strong><br/>No file is stored, transferred, or analyzed by this page.</p></div>
      </aside>
    </section>
  </div>;
}
