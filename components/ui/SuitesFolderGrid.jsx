import React from 'react';
import { createRoot } from 'react-dom/client';
import FolderFloat from './FolderFloat.jsx';

const SUITE_PALETTES = [
  { folderColor: '#3730a3', frontColor: '#4f46e5', paperColor: '#eef2ff' },
  { folderColor: '#1e3a8a', frontColor: '#2563eb', paperColor: '#eff6ff' },
  { folderColor: '#5b21b6', frontColor: '#7c3aed', paperColor: '#f5f3ff' },
  { folderColor: '#0f766e', frontColor: '#0d9488', paperColor: '#f0fdfa' },
  { folderColor: '#334155', frontColor: '#475569', paperColor: '#f8fafc' }
];

const UNASSIGNED_PALETTE = {
  folderColor: '#334155',
  frontColor: '#475569',
  paperColor: '#f1f5f9'
};

export function SuitesFolderGrid({
  folders = [],
  isLightTheme = false,
  searchQuery = '',
  onSelectTestCase,
  onViewSuite,
  onRenameSuite,
  onDeleteSuite,
  onCreateSuite
}) {
  if (!folders || folders.length === 0) {
    return (
      <div className="dashboard-card p-4 text-center text-muted" style={{ gridColumn: '1 / -1' }}>
        {searchQuery ? (
          <span>No suites match your search query.</span>
        ) : (
          <span>
            No modules or test suites created yet in Supabase. Click{' '}
            <button
              type="button"
              className="btn btn-link p-0 text-primary font-semibold"
              onClick={() => onCreateSuite?.()}
            >
              + Create New Suite
            </button>{' '}
            above to add one.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`suites-folder-grid${isLightTheme ? ' light' : ' dark'}`}>
      {folders.map((folder, index) => {
        const cases = Array.isArray(folder.cases) ? folder.cases : [];
        const total = cases.length;
        const passed = Number(folder.passedCount || 0);
        const isUnassigned = Boolean(folder.isSystemUnassigned);
        const palette = isUnassigned
          ? UNASSIGNED_PALETTE
          : SUITE_PALETTES[index % SUITE_PALETTES.length];

        const items =
          total > 0
            ? cases.map(tc => ({
                label: `${tc.id}: ${tc.title}`,
                value: tc.id
              }))
            : [{ label: 'No test cases yet', value: '__empty__', disabled: true }];

        const sublabel = `${total} ${total === 1 ? 'test case' : 'test cases'}`;

        return (
          <div key={folder.id} className="suite-folder-cell" data-suite-card-id={folder.id}>
            <div className="suite-folder-stage">
              <FolderFloat
                items={items}
                label={folder.name}
                sublabel={sublabel}
                trigger="hover"
                closeOnSelect={false}
                physics={true}
                drift={0.5}
                width={230}
                height={165}
                radius={14}
                spread={150}
                lift={20}
                tilt={8}
                flapAngle={34}
                restAngle={16}
                openDuration={520}
                stagger={45}
                bounce={0.3}
                folderColor={palette.folderColor}
                frontColor={palette.frontColor}
                paperColor={palette.paperColor}
                labelColor="#ffffff"
                itemColor="#ffffff"
                itemTextColor="#0f172a"
                onSelect={value => {
                  if (!value || value === '__empty__') return;
                  onSelectTestCase?.(value);
                }}
              />
            </div>

            <div className="suite-folder-action-bar">
              <span
                className={`badge ${passed === total && total > 0 ? 'badge-passed' : 'badge-untested'} text-xs`}
                title={`${passed} of ${total} passed`}
              >
                {passed}/{total} Passed
              </span>

              <div className="suite-folder-action-btns">
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => onViewSuite?.(isUnassigned ? 'all' : folder.id)}
                  title="Filter repository by this suite"
                >
                  <i className="fa-solid fa-folder-open" /> View
                </button>
                {!isUnassigned ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => onRenameSuite?.(folder.id)}
                      title="Rename / Edit suite"
                      aria-label={`Rename ${folder.name}`}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-xs"
                      onClick={() => onDeleteSuite?.(folder.id)}
                      title="Delete suite"
                      aria-label={`Delete ${folder.name}`}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const mountedSuiteRoots = new WeakMap();

export function mountSuitesFolderGrid(container, props) {
  if (!container) return;
  let root = mountedSuiteRoots.get(container);
  if (!root) {
    container.innerHTML = '';
    root = createRoot(container);
    mountedSuiteRoots.set(container, root);
  }
  root.render(<SuitesFolderGrid {...props} />);
}
