using System.Diagnostics;
using System.Reflection;
using System.Text;

namespace GentillCompetenciaAPAC;

internal static class Program
{
    private const string Version = "2.4.0";
    private const string IndexResource = "GentillCompetenciaAPAC.Embedded.index.html";
    private const string CssResource = "GentillCompetenciaAPAC.Embedded.styles.css";
    private const string JsResource = "GentillCompetenciaAPAC.Embedded.app.js";

    [STAThread]
    private static int Main(string[] args)
    {
        if (args.Any(a => string.Equals(a, "--self-test", StringComparison.OrdinalIgnoreCase)))
            return SelfTest();

        try
        {
            var appDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "GentillMobOps",
                "GentillCompetenciaAPAC",
                Version);

            Directory.CreateDirectory(appDir);

            ExtractResource(IndexResource, Path.Combine(appDir, "index.html"));
            ExtractResource(CssResource, Path.Combine(appDir, "styles.css"));
            ExtractResource(JsResource, Path.Combine(appDir, "app.js"));

            var indexPath = Path.Combine(appDir, "index.html");
            var indexUri = new Uri(indexPath).AbsoluteUri;

            var edge = FindEdge();
            if (!string.IsNullOrWhiteSpace(edge))
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = edge,
                    Arguments = $"--app=\"{indexUri}\" --start-maximized",
                    UseShellExecute = true,
                    WorkingDirectory = appDir
                });
            }
            else
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = indexPath,
                    UseShellExecute = true,
                    WorkingDirectory = appDir
                });
            }

            return 0;
        }
        catch (Exception ex)
        {
            try
            {
                var logPath = Path.Combine(Path.GetTempPath(), "GentillCompetenciaAPAC_v2.4.0_error.txt");
                File.WriteAllText(logPath, ex.ToString());
                System.Windows.Forms.MessageBox.Show(
                    $"Não foi possível iniciar o Gentill Competência APAC.\n\nDetalhes registrados em:\n{logPath}\n\n{ex.Message}",
                    "Gentill Competência APAC",
                    System.Windows.Forms.MessageBoxButtons.OK,
                    System.Windows.Forms.MessageBoxIcon.Error);
            }
            catch
            {
                // A aplicação é WinExe; em caso extremo, apenas retorna código de erro.
            }

            return 1;
        }
    }

    private static int SelfTest()
    {
        try
        {
            var index = ReadResourceText(IndexResource);
            var css = ReadResourceText(CssResource);
            var js = ReadResourceText(JsResource);

            if (!index.Contains("v2.4.0", StringComparison.Ordinal)) return 21;
            if (!index.Contains("Validador OCI/PMAE", StringComparison.Ordinal)) return 22;
            if (css.Length < 1000) return 23;
            if (!js.Contains("010082", StringComparison.Ordinal)) return 24;
            if (js.Length < 5000) return 25;

            return 0;
        }
        catch
        {
            return 20;
        }
    }

    private static string ReadResourceText(string resourceName)
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var input = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Recurso incorporado não encontrado: {resourceName}");
        using var reader = new StreamReader(input, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
        return reader.ReadToEnd();
    }

    private static void ExtractResource(string resourceName, string destination)
    {
        var assembly = Assembly.GetExecutingAssembly();
        using var input = assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Recurso incorporado não encontrado: {resourceName}");

        using var output = new FileStream(destination, FileMode.Create, FileAccess.Write, FileShare.Read);
        input.CopyTo(output);
    }

    private static string? FindEdge()
    {
        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Microsoft", "Edge", "Application", "msedge.exe")
        };

        return candidates.FirstOrDefault(File.Exists);
    }
}
