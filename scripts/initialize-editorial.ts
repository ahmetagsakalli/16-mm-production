import { initializeEditorial } from '../src/lib/cms/initialize-editorial';
import { db } from '../src/lib/cms/store';
try { console.log(await initializeEditorial()); } finally { db().close(); }
